<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Item;
use App\Models\Market;
use App\Models\MarketItem;
use App\Services\PriceRecorder;
use Illuminate\Http\Request;

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
            'is_available' => 'required|boolean',
            'cutoff_time' => 'nullable|date_format:H:i',
        ]);

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
        ]);

        return response()->json(['message' => 'Market listing updated.']);
    }
}
