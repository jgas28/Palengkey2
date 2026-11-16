<?php

namespace App\Support;

use App\Models\Order;
use App\Models\Setting;
use Illuminate\Support\Facades\Cache;

/**
 * Which payment methods customers can choose. An admin turns one off while
 * PayMongo (or the bank/wallet behind it) has an outage or maintenance, e.g.
 * GCash; checkout then hides it and the API refuses it.
 *
 * Stored in one setting, `payment_methods_disabled`: JSON
 * {"gcash": {"reason": "...", "by": "...", "at": "ISO time"}}. A method not
 * listed is on.
 */
final class PaymentMethods
{
    private const SETTING = 'payment_methods_disabled';

    /** @return list<string> every method, in checkout order */
    public static function all(): array
    {
        return ['cod', ...Order::CASHLESS_METHODS];
    }

    /** @return array<string, array{reason: ?string, by: ?string, at: ?string}> */
    public static function disabled(): array
    {
        $decoded = json_decode((string) Setting::get(self::SETTING, '{}'), true);

        return is_array($decoded)
            ? array_intersect_key($decoded, array_flip(self::all()))
            : [];
    }

    public static function isEnabled(string $method): bool
    {
        return ! array_key_exists($method, self::disabled());
    }

    /** The message checkout returns for a method that's off. */
    public static function unavailableMessage(string $method): string
    {
        $reason = self::disabled()[$method]['reason'] ?? null;

        return Order::paymentMethodLabel($method).' is temporarily unavailable'
            .($reason ? " ({$reason})" : '')
            .'. Please choose another payment method.';
    }

    /** @return list<array{method: string, label: string, enabled: bool, reason: ?string, changed_by: ?string, changed_at: ?string}> */
    public static function status(): array
    {
        $disabled = self::disabled();

        return array_map(fn (string $method) => [
            'method' => $method,
            'label' => Order::paymentMethodLabel($method),
            'enabled' => ! isset($disabled[$method]),
            'reason' => $disabled[$method]['reason'] ?? null,
            'changed_by' => $disabled[$method]['by'] ?? null,
            'changed_at' => $disabled[$method]['at'] ?? null,
        ], self::all());
    }

    /** Returns false (and changes nothing) when this would turn off the last method. */
    public static function set(string $method, bool $enabled, ?string $reason, string $by): bool
    {
        // Two admins switching different methods at once must not undo each other.
        return Cache::lock('payment-methods-update', 10)->block(5, function () use ($method, $enabled, $reason, $by) {
            $disabled = self::disabled();

            if ($enabled) {
                unset($disabled[$method]);
            } else {
                $disabled[$method] = ['reason' => $reason, 'by' => $by, 'at' => now()->toIso8601String()];

                if (count($disabled) >= count(self::all())) {
                    return false;
                }
            }

            Setting::set(self::SETTING, json_encode((object) $disabled));

            return true;
        });
    }
}
