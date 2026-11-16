<?php

namespace App\Support;

use Illuminate\Support\Facades\Log;

/**
 * The Firebase service account key (path in services.firebase.credentials,
 * kept outside the project) and RS256 signing with it. Used for push
 * notifications and for the riders' Firebase sign-in tokens.
 */
final class FirebaseServiceAccount
{
    public static function credentials(): ?array
    {
        $path = config('services.firebase.credentials');

        if (! $path || ! is_readable($path)) {
            return null;
        }

        $credentials = json_decode((string) file_get_contents($path), true);

        return is_array($credentials) && ! empty($credentials['client_email']) && ! empty($credentials['private_key'])
            ? $credentials
            : null;
    }

    /** A JWT with the given payload, signed with the service account's private key. */
    public static function sign(array $credentials, array $payload): ?string
    {
        $encode = fn (string $value) => rtrim(strtr(base64_encode($value), '+/', '-_'), '=');

        $unsigned = $encode(json_encode(['alg' => 'RS256', 'typ' => 'JWT']))
            .'.'.$encode(json_encode($payload, JSON_UNESCAPED_SLASHES));

        if (! openssl_sign($unsigned, $signature, $credentials['private_key'], OPENSSL_ALGO_SHA256)) {
            Log::error('Firebase service account key could not be used to sign.');

            return null;
        }

        return $unsigned.'.'.$encode($signature);
    }
}
