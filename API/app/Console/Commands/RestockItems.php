<?php

namespace App\Console\Commands;

use App\Models\ItemPrice;
use App\Models\MarketItem;
use App\Services\AuditLogger;
use App\Services\PriceRecorder;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Schema;

/**
 * Brings "out of stock" listings back once their date arrives, at the last
 * price recorded for that market (marking unavailable clears the live price).
 */
class RestockItems extends Command
{
    protected $signature = 'items:restock';

    protected $description = 'Make out-of-stock market items available again when their restock date arrives';

    public function handle(): int
    {
        if (! Schema::hasColumn('market_items', 'out_of_stock_until')) {
            $this->warn('Run the latest migration first (market_items.out_of_stock_until).');

            return self::SUCCESS;
        }

        $today = now('Asia/Manila')->toDateString();
        $restocked = 0;

        MarketItem::query()
            ->whereNotNull('out_of_stock_until')
            ->whereDate('out_of_stock_until', '<=', $today)
            ->each(function (MarketItem $listing) use (&$restocked) {
                $lastPrice = ItemPrice::where('market_id', $listing->market_id)
                    ->where('item_id', $listing->item_id)
                    ->latest('id')
                    ->value('price');

                if ($lastPrice === null) {
                    // No price to come back at: leave it unavailable, just clear the date.
                    $listing->update(['out_of_stock_until' => null]);

                    return;
                }

                PriceRecorder::record($listing->market_id, $listing->item_id, $lastPrice, true);
                $listing->update(['out_of_stock_until' => null]);
                AuditLogger::custom('item_restocked', ['market_id' => $listing->market_id, 'item_id' => $listing->item_id]);
                $restocked++;
            });

        $this->info("Restocked {$restocked} listing(s).");

        return self::SUCCESS;
    }
}
