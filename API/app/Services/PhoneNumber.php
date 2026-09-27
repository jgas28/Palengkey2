<?php

namespace App\Services;

/** Philippine mobile number normalization/lookup helpers (E.164, +63 prefix). */
class PhoneNumber
{
    public const PHILIPPINE_E164_REGEX = '/^\+63\d{10}$/';

    public static function normalizePhilippineMobile(?string $value): ?string
    {
        $value = trim((string) $value);

        if ($value === '') {
            return null;
        }

        $compact = preg_replace('/[\s\-\(\)]/', '', $value) ?? $value;

        if (preg_match(self::PHILIPPINE_E164_REGEX, $compact)) {
            return $compact;
        }

        $digits = preg_replace('/\D+/', '', $compact) ?? '';

        if (preg_match('/^63\d{10}$/', $digits)) {
            return '+'.$digits;
        }

        if (preg_match('/^0\d{10}$/', $digits)) {
            return '+63'.substr($digits, 1);
        }

        if (preg_match('/^\d{10}$/', $digits)) {
            return '+63'.$digits;
        }

        return $compact;
    }

    public static function isValidPhilippineMobile(?string $value): bool
    {
        $normalized = self::normalizePhilippineMobile($value);

        return is_string($normalized)
            && preg_match(self::PHILIPPINE_E164_REGEX, $normalized) === 1;
    }

    /** All the ways this number might be stored historically, for WHERE IN lookups. */
    public static function databaseLookupVariants(?string $value): array
    {
        $normalized = self::normalizePhilippineMobile($value);

        if (! self::isValidPhilippineMobile($normalized)) {
            return array_values(array_filter([$value]));
        }

        return array_values(array_unique([
            $normalized,
            ltrim($normalized, '+'),
            '0'.substr($normalized, 3),
        ]));
    }
}
