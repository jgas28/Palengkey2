<?php

namespace App\Services;

use App\Models\Order;
use App\Models\Rider;
use App\Support\FirebaseServiceAccount;

/**
 * Firebase sign-in tokens for the rider app, so the Realtime Database rules
 * (firebase/database.rules.json) can tell which rider is writing a location.
 *
 * The token's claims say who the rider is and which orders they are
 * delivering right now; the rules only accept writes to riders_location/{own id}
 * and orders/{one of those orders}/driver_location. The claims stop working
 * after VALID_FOR_SECONDS, so a rider taken off an order (or deactivated) loses
 * write access within the hour; the app fetches a new token before then.
 */
class FirebaseRiderTokenService
{
    /** Firebase's fixed audience for custom sign-in tokens. */
    private const AUDIENCE = 'https://identitytoolkit.googleapis.com/google.identity.identitytoolkit.v1.IdentityToolkit';

    public const VALID_FOR_SECONDS = 3600;

    /** Plenty for one rider; keeps the claims well under Firebase's 1000-byte limit. */
    private const MAX_ORDERS = 20;

    /** @return array{token: string, uid: string, orders: list<int>, valid_until: int}|null null when Firebase isn't configured */
    public function issue(Rider $rider): ?array
    {
        $credentials = FirebaseServiceAccount::credentials();

        if (! $credentials) {
            return null;
        }

        $orderIds = $this->deliveringOrderIds($rider);
        $now = time();
        $validUntilMs = ($now + self::VALID_FOR_SECONDS) * 1000;
        $uid = 'rider_'.$rider->id;

        $token = FirebaseServiceAccount::sign($credentials, [
            'iss' => $credentials['client_email'],
            'sub' => $credentials['client_email'],
            'aud' => self::AUDIENCE,
            'iat' => $now,
            'exp' => $now + 3600, // Firebase's maximum for a custom token
            'uid' => $uid,
            'claims' => [
                'role' => 'rider',
                'rider_id' => (string) $rider->id,
                // ",12,15," so the rules can match a whole id with contains(",12,").
                'orders' => $orderIds === [] ? ',' : ','.implode(',', $orderIds).',',
                // Compared with the rules' `now` (milliseconds).
                'valid_until' => $validUntilMs,
            ],
        ]);

        return $token === null ? null : [
            'token' => $token,
            'uid' => $uid,
            'orders' => $orderIds,
            'valid_until' => $validUntilMs,
        ];
    }

    /** @return list<int> the orders this rider is out delivering */
    protected function deliveringOrderIds(Rider $rider): array
    {
        return Order::where('rider_id', $rider->id)
            ->where('status', 'out_for_delivery')
            ->orderByDesc('id')
            ->limit(self::MAX_ORDERS)
            ->pluck('id')
            ->map(fn ($id) => (int) $id)
            ->values()
            ->all();
    }
}
