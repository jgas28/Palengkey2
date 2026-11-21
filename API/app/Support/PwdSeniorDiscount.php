<?php

namespace App\Support;

/**
 * PWD / Senior Citizen discount: 20% of the delivery fee after VAT is split off,
 * using the same split as checkout (VAT = 12% of the fee). Market goods and the
 * service fee are not discounted.
 *
 * ₱49.00 delivery → VAT ₱5.88, VAT-exclusive ₱43.12 → discount ₱8.62.
 */
final class PwdSeniorDiscount
{
    public const RATE = 0.20;

    public const VAT_RATE = 0.12;

    /**
     * @param  float  $deliveryFee  the delivery fee the customer pays, VAT included
     *                              (after any bulk delivery subsidy)
     * @return array{delivery_fee: float, vat: float, vat_exclusive: float, discount: float}
     */
    public static function forDeliveryFee(float $deliveryFee): array
    {
        $fee = max(0.0, round($deliveryFee, 2));
        $vat = round($fee * self::VAT_RATE, 2);
        $vatExclusive = round($fee - $vat, 2);

        return [
            'delivery_fee' => $fee,
            'vat' => $vat,
            'vat_exclusive' => $vatExclusive,
            'discount' => round($vatExclusive * self::RATE, 2),
        ];
    }
}
