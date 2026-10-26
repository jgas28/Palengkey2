<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Item;
use App\Models\Market;
use App\Models\MarketPriceSnapshot;
use App\Support\BulkPricing;
use App\Support\MarketAvailability;
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

        // Every item listed at this market — available ones (live price) plus
        // out-of-stock and seasonal ones, which show with a label but can't be added.
        $query = Item::query()
            ->where('items.status', 1)
            ->where(function ($q) use ($marketId) {
                $q->whereIn('items.id', fn ($s) => $s->select('item_id')->from('market_price_snapshots')->where('market_id', $marketId))
                    ->orWhereIn('items.id', fn ($s) => $s->select('item_id')->from('market_items')->where('market_id', $marketId));
            })
            ->with(['category', 'type:id,name', 'unit:id,short_name']);

        // Orderable items first, then out of stock / seasonal.
        $query->orderByRaw(
            'CASE WHEN EXISTS (SELECT 1 FROM market_price_snapshots s WHERE s.item_id = items.id AND s.market_id = ?) THEN 0 ELSE 1 END',
            [$marketId],
        );

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
            // Left join: out-of-stock/seasonal items have no live price and sort last.
            $query->leftJoin('market_price_snapshots as mps', function ($join) use ($marketId) {
                $join->on('mps.item_id', '=', 'items.id')->where('mps.market_id', $marketId);
            })
                ->select('items.*')
                ->orderBy('mps.price', $sort === 'price-asc' ? 'asc' : 'desc');
        } elseif ($sort === 'az') {
            $query->orderBy('items.name');
        }

        // Stable tiebreak so "Load more" never repeats or skips items between pages.
        $query->orderBy('items.id');

        $items = $query->paginate(20);

        // Batch-fetch snapshots and cutoff overrides once instead of per-item (no N+1).
        $snapshots = MarketPriceSnapshot::where('market_id', $marketId)
            ->whereIn('item_id', $items->pluck('id'))
            ->get()
            ->keyBy('item_id');

        $marketItemPivots = DB::table('market_items')
            ->where('market_id', $marketId)
            ->whereIn('item_id', $items->pluck('id'))
            ->get(['item_id', 'cutoff_time', 'cutoff_timezone', ...MarketAvailability::columns()])
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
                ...MarketAvailability::forItem($snap !== null, $pivot),
                ...$this->bulkInfo($item, $snap?->price),
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

        $pivot = DB::table('market_items')
            ->where('market_id', $marketId)
            ->where('item_id', $item->id)
            ->first(['item_id', ...MarketAvailability::columns()]);

        if (! $snapshot && ! $pivot) {
            return response()->json(['message' => 'Item not sold at this market'], 404);
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
            'price' => $snapshot ? PriceDisplay::markedUp($snapshot->price) : null,
            'base_price' => $snapshot?->price,
            'price_at' => $snapshot?->price_at,
            'cutoff_time' => $item->getCutoffTimeStringForMarket($marketId),
            'is_cutoff' => $item->isPastCutoffForMarket($marketId),
            ...MarketAvailability::forItem($snapshot !== null, $pivot),
            ...$this->bulkInfo($item, $snapshot?->price),
        ]);
    }

    /** For the quick-view bulk banner: threshold and wholesale price, null when not eligible. */
    private function bulkInfo(Item $item, mixed $basePrice): array
    {
        $threshold = BulkPricing::thresholdKg($item);

        return [
            'bulk_min_kg' => $threshold,
            'bulk_price' => $threshold !== null && $basePrice !== null ? round(BulkPricing::unitPrice($item, $basePrice), 2) : null,
            'bulk_delivery_subsidy_cap' => $threshold !== null ? BulkPricing::subsidyCap() : null,
        ];
    }
}
