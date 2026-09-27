<?php

namespace App\Services;

use App\Models\Item;
use App\Models\ItemPrice;
use App\Models\MarketItem;
use App\Models\MarketPriceSnapshot;
use App\Models\MarketPriceTrend;
use Illuminate\Support\Facades\DB;

class PriceRecorder
{
    public static function record($marketId, $itemId, $price, $available = true)
    {
        return DB::transaction(function () use ($marketId, $itemId, $price, $available) {
            $item = Item::lockForUpdate()->findOrFail($itemId);

            $availability = MarketItem::updateOrCreate(
                ['market_id' => $marketId, 'item_id' => $itemId],
                ['is_available' => $available]
            );

            AuditLogger::log('availability_changed', $availability, $availability->id, null, ['available' => $available]);

            if (! $available) {
                MarketPriceSnapshot::where(['market_id' => $marketId, 'item_id' => $itemId])->delete();
                AuditLogger::custom('item_marked_unavailable', ['market_id' => $marketId, 'item_id' => $itemId]);

                return null;
            }

            // Prevent duplicate price-history spam when re-saving the same price.
            $snapshot = MarketPriceSnapshot::where('market_id', $marketId)
                ->where('item_id', $itemId)
                ->lockForUpdate()
                ->first();

            if ($snapshot && (float) $snapshot->price === (float) $price) {
                $snapshot->update(['price_at' => now()]);
                AuditLogger::custom('price_revalidated', ['market_id' => $marketId, 'item_id' => $itemId, 'price' => $price]);

                return $snapshot;
            }

            $priceRow = ItemPrice::create([
                'item_id' => $itemId,
                'market_id' => $marketId,
                'unit_id' => $item->unit_id,
                'price' => $price,
            ]);

            AuditLogger::log('price_created', $priceRow, $priceRow->id, null, $priceRow->toArray());

            MarketPriceSnapshot::updateOrCreate(
                ['market_id' => $marketId, 'item_id' => $itemId],
                ['unit_id' => $item->unit_id, 'price' => $price, 'price_at' => now()]
            );

            MarketPriceTrend::updateOrCreate(
                ['market_id' => $marketId, 'item_id' => $itemId, 'price_date' => today()],
                ['price' => $price]
            );

            return $priceRow;
        });
    }
}
