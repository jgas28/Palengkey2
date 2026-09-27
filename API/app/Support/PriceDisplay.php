<?php

namespace App\Support;

use App\Models\Setting;

class PriceDisplay
{
    private static ?float $markupPercent = null;

    public static function markedUp(mixed $price, ?float $markupPercent = null): float
    {
        $basePrice = max(0, (float) ($price ?? 0));
        $markupPercent ??= self::markupPercent();

        return round($basePrice * (1 + ($markupPercent / 100)), 2);
    }

    public static function markupPercent(): float
    {
        return self::$markupPercent ??= (float) Setting::get('item_markup_percent', 10);
    }
}
