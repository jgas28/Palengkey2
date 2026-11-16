<?php

namespace App\Services;

use App\Models\CustomerDevice;
use App\Support\FirebaseServiceAccount;
use Illuminate\Http\Client\Pool;
use Illuminate\Http\Client\Response;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * Sends through Firebase Cloud Messaging (HTTP v1). Failures are logged and
 * counted, never thrown: a push must not be able to break an order update.
 */
class PushNotificationService
{
    private const ACCESS_TOKEN_CACHE_KEY = 'firebase-messaging-access-token';

    private const SCOPE = 'https://www.googleapis.com/auth/firebase.messaging';

    private const TOKEN_URL = 'https://oauth2.googleapis.com/token';

    private const CONCURRENT_SENDS = 50;

    public function sendToTokens(array $tokens, string $title, string $body, array $data = []): array
    {
        $tokens = array_values(array_unique(array_filter($tokens)));

        if ($tokens === []) {
            return ['sent' => 0, 'failed' => 0];
        }

        try {
            return $this->deliver($tokens, $title, $body, $data);
        } catch (\Throwable $e) {
            Log::error('Push notification send failed.', ['message' => $e->getMessage()]);

            return ['sent' => 0, 'failed' => count($tokens)];
        }
    }

    private function deliver(array $tokens, string $title, string $body, array $data): array
    {
        $credentials = $this->credentials();
        $accessToken = $credentials ? $this->accessToken($credentials) : null;
        $projectId = config('services.firebase.project_id') ?: ($credentials['project_id'] ?? null);

        if (! $accessToken || ! $projectId) {
            Log::warning('Push notifications are not configured; nothing was sent.');

            return ['sent' => 0, 'failed' => count($tokens)];
        }

        $url = "https://fcm.googleapis.com/v1/projects/{$projectId}/messages:send";
        $sent = 0;
        $failed = 0;
        $unregistered = [];

        foreach (array_chunk($tokens, self::CONCURRENT_SENDS) as $chunk) {
            $responses = Http::pool(fn (Pool $pool) => array_map(
                fn (string $token) => $pool->withToken($accessToken)->timeout(10)->post($url, [
                    'message' => $this->message($token, $title, $body, $data),
                ]),
                $chunk,
            ));

            foreach ($chunk as $index => $token) {
                $response = $responses[$index] ?? null;

                if ($response instanceof Response && $response->successful()) {
                    $sent++;

                    continue;
                }

                $failed++;

                if ($response instanceof Response && $this->isUnregistered($response)) {
                    $unregistered[] = $token;
                } elseif ($response instanceof Response) {
                    Log::warning('Push notification rejected.', [
                        'status' => $response->status(),
                        'error' => $response->json('error.status'),
                    ]);

                    if ($response->status() === 401) {
                        Cache::forget(self::ACCESS_TOKEN_CACHE_KEY);
                    }
                }
            }
        }

        if ($unregistered !== []) {
            $this->forgetTokens($unregistered);
        }

        return ['sent' => $sent, 'failed' => $failed];
    }

    private function message(string $token, string $title, string $body, array $data): array
    {
        $message = [
            'token' => $token,
            'notification' => ['title' => $title, 'body' => $body],
            'android' => ['priority' => 'high'],
        ];

        if ($data !== []) {
            $message['data'] = array_map('strval', $data);
        }

        // Where a browser notification opens; Firebase only accepts https links.
        $path = $data['url'] ?? null;
        $link = is_string($path) && str_starts_with($path, '/')
            ? rtrim((string) config('services.firebase.web_url'), '/').$path
            : $path;

        if (is_string($link) && str_starts_with($link, 'https://')) {
            $message['webpush'] = ['fcm_options' => ['link' => $link]];
        }

        return $message;
    }

    /** The app was uninstalled or the token replaced. Other errors keep the token. */
    private function isUnregistered(Response $response): bool
    {
        return $response->status() === 404
            || collect($response->json('error.details', []))->contains('errorCode', 'UNREGISTERED');
    }

    protected function forgetTokens(array $tokens): void
    {
        CustomerDevice::whereIn('fcm_token', $tokens)->update(['fcm_token' => null]);
    }

    private function credentials(): ?array
    {
        return FirebaseServiceAccount::credentials();
    }

    private function accessToken(array $credentials): ?string
    {
        if ($cached = Cache::get(self::ACCESS_TOKEN_CACHE_KEY)) {
            return $cached;
        }

        $assertion = $this->signedAssertion($credentials);

        if (! $assertion) {
            return null;
        }

        $response = Http::asForm()->timeout(10)->post(self::TOKEN_URL, [
            'grant_type' => 'urn:ietf:params:oauth:grant-type:jwt-bearer',
            'assertion' => $assertion,
        ]);

        $token = $response->successful() ? $response->json('access_token') : null;

        if (! $token) {
            Log::error('Could not get a Firebase access token.', ['status' => $response->status()]);

            return null;
        }

        // Renewed five minutes early so a token never expires in the middle of a send.
        Cache::put(self::ACCESS_TOKEN_CACHE_KEY, $token, max(60, (int) $response->json('expires_in', 3600) - 300));

        return $token;
    }

    /** The signed request Google exchanges for an access token (RS256 JWT). */
    private function signedAssertion(array $credentials): ?string
    {
        $now = time();

        return FirebaseServiceAccount::sign($credentials, [
            'iss' => $credentials['client_email'],
            'scope' => self::SCOPE,
            'aud' => self::TOKEN_URL,
            'iat' => $now,
            'exp' => $now + 3600,
        ]);
    }
}
