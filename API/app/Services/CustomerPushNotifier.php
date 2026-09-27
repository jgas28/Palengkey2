<?php

namespace App\Services;

use App\Models\Customer;

/** Best-effort push — silently no-ops when the customer has no device tokens or FCM isn't configured. */
class CustomerPushNotifier
{
    public static function send(Customer $customer, string $title, string $body, array $data = []): void
    {
        $tokens = $customer->devices()
            ->whereNotNull('fcm_token')
            ->pluck('fcm_token')
            ->filter()->unique()->values()->all();

        if (empty($tokens) || ! self::allowsPush($customer)) {
            return;
        }

        app(PushNotificationService::class)->sendToTokens($tokens, $title, $body, $data);
    }

    private static function allowsPush(Customer $customer): bool
    {
        $preferences = array_merge(
            ['order_updates' => true, 'push_notifications' => true],
            $customer->notification_preferences ?? []
        );

        return (bool) ($preferences['push_notifications'] ?? true);
    }
}
