<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Cache;

class Setting extends Model
{
    protected $fillable = ['key', 'value'];

    public static function get(string $key, mixed $default = null): mixed
    {
        $value = Cache::rememberForever("setting_{$key}", function () use ($key) {
            // Cache::rememberForever can't distinguish "never cached" from a cached
            // null, so wrap the DB result to tell them apart.
            return ['value' => self::where('key', $key)->value('value')];
        })['value'];

        return $value ?? $default;
    }

    public static function set(string $key, mixed $value): void
    {
        self::updateOrCreate(['key' => $key], ['value' => $value]);
        Cache::forget("setting_{$key}");
    }

    /** Tiered service fee: fixed amount below the minimum order threshold, else a percent of subtotal capped at a max. */
    public static function calculateServiceFee(float $subtotal): float
    {
        $threshold = (float) self::get('minimum_order_amount', 500);

        if ($subtotal < $threshold) {
            return (float) self::get('service_fee_fixed_amount', 20);
        }

        $percent = (float) self::get('service_fee_percent', 2);
        $maxAmount = (float) self::get('service_fee_max_amount', 100);
        $fee = round($subtotal * ($percent / 100), 2);

        return $maxAmount > 0 ? min($fee, $maxAmount) : $fee;
    }
}
