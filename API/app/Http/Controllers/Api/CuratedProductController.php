<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CuratedProduct;
use App\Models\Market;
use App\Models\MarketPriceSnapshot;
use App\Support\PriceDisplay;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class CuratedProductController extends Controller
{
    public function index(Request $request)
    {
        $marketId = $request->query('market_id');
        $section = $request->query('section');

        if (! $marketId) {
            return response()->json(['message' => 'market_id required'], 422);
        }

        if (! $section || ! array_key_exists($section, CuratedProduct::SECTIONS)) {
            return response()->json(['message' => 'section required'], 422);
        }

        $curated = CuratedProduct::activeForSection($section)
            ->with(['item.category:id,name', 'item.type:id,name', 'item.unit:id,short_name'])
            ->get()
            // The item itself may have been deactivated since it was curated.
            ->filter(fn (CuratedProduct $curatedProduct) => $curatedProduct->item?->status);

        if ($curated->isEmpty()) {
            return response()->json(['data' => []]);
        }

        $itemIds = $curated->pluck('item_id');

        // Only items actually priced/listed at this market — same rule ItemApiController
        // applies, so a curated item that isn't sold here simply drops out of the response.
        $snapshots = MarketPriceSnapshot::where('market_id', $marketId)
            ->whereIn('item_id', $itemIds)
            ->get()
            ->keyBy('item_id');

        $marketItemPivots = DB::table('market_items')
            ->where('market_id', $marketId)
            ->whereIn('item_id', $itemIds)
            ->get(['item_id', 'cutoff_time', 'cutoff_timezone'])
            ->keyBy('item_id');

        $market = Market::find($marketId);

        $items = $curated
            ->filter(fn (CuratedProduct $curatedProduct) => isset($snapshots[$curatedProduct->item_id]))
            ->map(function (CuratedProduct $curatedProduct) use ($snapshots, $marketItemPivots, $market) {
                $item = $curatedProduct->item;
                $snapshot = $snapshots[$item->id];
                $pivot = $marketItemPivots[$item->id] ?? null;

                return [
                    'id' => $item->id,
                    'name' => $item->name,
                    'image' => $item->image_full_url,
                    'price' => PriceDisplay::markedUp($snapshot->price),
                    'base_price' => $snapshot->price,
                    'unit' => $item->unit?->short_name,
                    'category' => $item->category?->name,
                    'type' => $item->type?->name,
                    'is_muslim_friendly' => str_contains(strtolower($item->type?->name ?? ''), 'halal'),
                    'cutoff_time' => $item->getCutoffTimeStringForMarketData($pivot, $market),
                    'is_cutoff' => $item->isPastCutoffForMarketData($pivot, $market),
                ];
            })
            ->values();

        return response()->json(['data' => $items]);
    }
}
