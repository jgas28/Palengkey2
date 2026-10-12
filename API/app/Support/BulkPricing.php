<?php

namespace App\Support;

use App\Models\Item;
use App\Models\Setting;

/**
 * Bulk-order tier: when one item's total weight in an order reaches its bulk
 * threshold, that item gets the wholesale price and the order gets the automatic
 * delivery subsidy (BULK-FREESHIP-49).
 *
 * Wholesale price is the retail price less a flat peso amount per kilo, set per
 * category (items can override; the "bulk_discount_per_kg" setting is the
 * fallback). E.g. ₱110/kg retail, ₱5/kg bulk → ₱105/kg. Per-gram units get the
 * proportional amount (₱5/kg → ₱0.005/g).
 *
 * Shared by the cart preview, checkout and catalog so all three always agree.
 */
class BulkPricing
{
    public const VOUCHER_CODE = 'BULK-FREESHIP-49';

    private const WEIGHT_UNITS = ['kg', 'kgs', 'kilo', 'kilos', 'kilogram', 'kilograms', 'g', 'gr', 'gram', 'grams'];

    public static function enabled(): bool
    {
        return (bool) (float) Setting::get('bulk_pricing_enabled', 1);
    }

    /** Global fallback ₱ off per kg when neither the item nor its category sets one. */
    public static function defaultDiscountPerKg(): float
    {
        return max(0, (float) Setting::get('bulk_discount_per_kg', 5));
    }

    /** ₱ off per kg for this item in bulk: item override → category → global default. */
    public static function discountPerKg(?Item $item): float
    {
        $amount = $item?->bulk_discount_per_kg ?? $item?->category?->bulk_discount_per_kg;

        return $amount !== null ? max(0, (float) $amount) : self::defaultDiscountPerKg();
    }

    public static function subsidyCap(): float
    {
        return max(0, (float) Setting::get('bulk_delivery_subsidy_cap', 49));
    }

    /** Threshold in kg for this item, or null when it can't be bought in bulk. */
    public static function thresholdKg(?Item $item): ?float
    {
        if (! $item || ! self::enabled() || ! self::isWeightUnit($item->unit)) {
            return null;
        }

        $threshold = $item->bulk_min_kg ?? $item->category?->bulk_min_kg;

        return $threshold !== null && (float) $threshold > 0 ? (float) $threshold : null;
    }

    /** Customer-facing wholesale price per unit (kg or g) for a vendor base price. */
    public static function unitPrice(?Item $item, mixed $basePrice): float
    {
        $retail = PriceDisplay::markedUp($basePrice);
        $kgPerUnit = self::isGramUnit($item?->unit) ? 0.001 : 1;

        return round(max(0, $retail - self::discountPerKg($item) * $kgPerUnit), 4);
    }

    /**
     * Totals each item's weight across all its lines (the same item can sit in
     * several lines with different notes) and checks it against the threshold.
     *
     * @param  iterable<array{item: ?Item, weight_kg: float}>  $lines
     * @return array<int, array{name: string, threshold_kg: float, total_kg: float, qualifies: bool}>
     *                                                                                                keyed by item_id; only bulk-eligible items
     */
    public static function evaluate(iterable $lines): array
    {
        $result = [];

        foreach ($lines as $line) {
            $item = $line['item'];
            $threshold = self::thresholdKg($item);

            if ($threshold === null) {
                continue;
            }

            $result[$item->id] ??= ['name' => $item->name, 'threshold_kg' => $threshold, 'total_kg' => 0.0, 'qualifies' => false];
            $result[$item->id]['total_kg'] = round($result[$item->id]['total_kg'] + max(0, (float) $line['weight_kg']), 3);
        }

        foreach ($result as &$entry) {
            // Small epsilon so 6 × 1.000 kg isn't missed to float rounding.
            $entry['qualifies'] = $entry['threshold_kg'] <= $entry['total_kg'] + 0.0001;
        }
        unset($entry);

        return $result;
    }

    public static function anyQualifies(array $evaluation): bool
    {
        foreach ($evaluation as $entry) {
            if ($entry['qualifies']) {
                return true;
            }
        }

        return false;
    }

    /** min(delivery fee, cap) when the order has a qualifying line. */
    public static function deliverySubsidy(array $evaluation, float $deliveryFee): float
    {
        return self::anyQualifies($evaluation) ? round(min(max(0, $deliveryFee), self::subsidyCap()), 2) : 0.0;
    }

    public static function isWeightUnit($unit): bool
    {
        return in_array(self::unitLabel($unit), self::WEIGHT_UNITS, true);
    }

    private static function isGramUnit($unit): bool
    {
        return in_array(self::unitLabel($unit), ['g', 'gr', 'gram', 'grams'], true);
    }

    private static function unitLabel($unit): string
    {
        return preg_replace('/[^a-z]/', '', strtolower(trim($unit?->short_name ?? $unit?->name ?? ''))) ?? '';
    }
}
