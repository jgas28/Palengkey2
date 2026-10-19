<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Item;
use App\Models\Market;
use App\Models\MarketItem;
use App\Services\PriceRecorder;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Schema;

class MarketItemController extends Controller
{
    /** Update price, availability, and cutoff time for an item at a market. */
    public function update(Request $request, Item $item)
    {
        $user = $request->user();
        $isSuperAdmin = $user->role === 'super_admin';

        $data = $request->validate([
            'market_id' => $isSuperAdmin ? 'required|exists:markets,id' : 'nullable',
            'price' => 'nullable|numeric|min:0',
            'is_available' => 'required_without:availability|boolean',
            // available | out_of_stock (back tomorrow) | unavailable (until turned back on)
            'availability' => 'sometimes|in:available,out_of_stock,unavailable',
            'cutoff_time' => 'nullable|date_format:H:i',
        ]);

        $availability = $data['availability'] ?? ($data['is_available'] ? 'available' : 'unavailable');
        $data['is_available'] = $availability === 'available';

        $marketId = $isSuperAdmin ? (int) $data['market_id'] : $user->market_id;

        if (! $marketId) {
            return response()->json(['message' => 'A market is required.'], 422);
        }

        if (! $isSuperAdmin && $marketId !== $user->market_id) {
            abort(403);
        }

        if ($data['is_available'] && $data['price'] === null) {
            return response()->json(['message' => 'Price is required when available.'], 422);
        }

        PriceRecorder::record($marketId, $item->id, $data['price'] ?? null, $data['is_available']);

        MarketItem::where('market_id', $marketId)->where('item_id', $item->id)->update([
            'cutoff_time' => $data['cutoff_time'] ?? null,
            'cutoff_timezone' => Market::find($marketId)?->cutoff_timezone ?? 'Asia/Manila',
            ...(Schema::hasColumn('market_items', 'out_of_stock_until') ? [
                'out_of_stock_until' => $availability === 'out_of_stock'
                    ? now('Asia/Manila')->addDay()->toDateString()
                    : null,
            ] : []),
        ]);

        return response()->json(['message' => 'Market listing updated.']);
    }
}
