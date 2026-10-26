<?php

namespace App\Support;

use Illuminate\Support\Facades\Schema;

/**
 * Customer-facing availability of an item at one market, shared by the shop
 * and recipe endpoints so both always agree.
 */
class MarketAvailability
{
    /**
     * available = has a live price; out_of_stock = sold out today, back on
     * available_on; unavailable = seasonal, back when an admin turns it on.
     */
    public static function forItem(bool $hasPrice, ?object $pivot): array
    {
        $until = $pivot->out_of_stock_until ?? null;

        return [
            'availability' => $hasPrice ? 'available' : ($until ? 'out_of_stock' : 'unavailable'),
            'available_on' => ! $hasPrice && $until ? substr((string) $until, 0, 10) : null,
        ];
    }

    /** market_items columns to read (the restock date only once its migration has run). */
    public static function columns(): array
    {
        static $hasColumn = null;
        $hasColumn ??= Schema::hasColumn('market_items', 'out_of_stock_until');

        return $hasColumn ? ['out_of_stock_until'] : [];
    }
}
