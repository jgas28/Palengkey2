<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Item;
use App\Models\Market;
use App\Models\MarketPriceSnapshot;
use App\Support\PriceDisplay;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ItemApiController extends Controller
{
    public function index(Request $request)
    {
        $marketId = $request->query('market_id');
        $categoryId = $request->query('category_id');
        $typeId = $request->query('type_id');
        $search = $request->query('search');
        $sort = $request->query('sort', 'recommended');

        if (! $marketId) {
            return response()->json(['message' => 'market_id required'], 422);
        }

        // Only items actually priced/listed at this market.
        $query = Item::query()
            ->where('status', 1)
            ->whereIn('id', function ($q) use ($marketId) {
                $q->select('item_id')->from('market_price_snapshots')->where('market_id', $marketId);
            })
            ->with(['category:id,name', 'type:id,name', 'unit:id,short_name']);

        if ($categoryId) {
            $query->where('category_id', $categoryId);
        }

        if ($typeId) {
            $query->where('type_id', $typeId);
        }

        if ($search) {
            $query->where('name', 'LIKE', "%{$search}%");
        }

        if ($sort === 'price-asc' || $sort === 'price-desc') {
            // One snapshot per (item, market) — the whereIn above already guarantees
            // a match exists, so this join can't drop rows.
            $query->join('market_price_snapshots as mps', function ($join) use ($marketId) {
                $join->on('mps.item_id', '=', 'items.id')->where('mps.market_id', $marketId);
            })
                ->select('items.*')
                ->orderBy('mps.price', $sort === 'price-asc' ? 'asc' : 'desc');
        } elseif ($sort === 'az') {
            $query->orderBy('items.name');
        } else {
            $query->orderBy('items.id');
        }

        $items = $query->paginate(20);

        // Batch-fetch snapshots and cutoff overrides once instead of per-item (no N+1).
        $snapshots = MarketPriceSnapshot::where('market_id', $marketId)
            ->whereIn('item_id', $items->pluck('id'))
            ->get()
            ->keyBy('item_id');

        $marketItemPivots = DB::table('market_items')
            ->where('market_id', $marketId)
            ->whereIn('item_id', $items->pluck('id'))
            ->get(['item_id', 'cutoff_time', 'cutoff_timezone'])
            ->keyBy('item_id');

        $market = Market::find($marketId);

        $items->getCollection()->transform(function (Item $item) use ($snapshots, $marketItemPivots, $market) {
            $snap = $snapshots[$item->id] ?? null;
            $pivot = $marketItemPivots[$item->id] ?? null;

            return [
                'id' => $item->id,
                'name' => $item->name,
                'image' => $item->image_full_url,
                'price' => $snap ? PriceDisplay::markedUp($snap->price) : null,
                'base_price' => $snap?->price,
                'unit' => $item->unit?->short_name,
                'category' => $item->category?->name,
                'type' => $item->type?->name,
                'is_muslim_friendly' => str_contains(strtolower($item->type?->name ?? ''), 'halal'),
                'cutoff_time' => $item->getCutoffTimeStringForMarketData($pivot, $market),
                'is_cutoff' => $item->isPastCutoffForMarketData($pivot, $market),
            ];
        });

        return response()->json($items);
    }

    public function show(Item $item, Request $request)
    {
        $marketId = $request->query('market_id');

        if (! $marketId) {
            return response()->json(['message' => 'market_id required'], 422);
        }

        $snapshot = MarketPriceSnapshot::where('market_id', $marketId)
            ->where('item_id', $item->id)
            ->first();

        if (! $snapshot) {
            return response()->json(['message' => 'Item unavailable'], 404);
        }

        return response()->json([
            'id' => $item->id,
            'name' => $item->name,
            'description' => $item->description,
            // Reference app's show() returns the raw picture_url path here (not the
            // full S3 URL index() uses) — that looks like a bug, since the frontend
            // renders this directly as an <img src>; using the same accessor as
            // index() so item-detail images actually resolve.
            'image' => $item->image_full_url,
            'category' => $item->category?->name,
            'type' => $item->type?->name,
            'is_muslim_friendly' => str_contains(strtolower($item->type?->name ?? ''), 'halal'),
            'unit' => $item->unit?->short_name,
            'price' => PriceDisplay::markedUp($snapshot->price),
            'base_price' => $snapshot->price,
            'price_at' => $snapshot->price_at,
            'cutoff_time' => $item->getCutoffTimeStringForMarket($marketId),
            'is_cutoff' => $item->isPastCutoffForMarket($marketId),
        ]);
    }
}
