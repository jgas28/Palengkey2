<?php

namespace App\Services;

/**
 * Placeholder — Firebase Cloud Messaging credentials aren't configured yet.
 * stats() endpoints that only count devices work fully; send() reports
 * everything as failed rather than silently pretending to deliver anything.
 */
class PushNotificationService
{
    public function sendToTokens(array $tokens, string $title, string $body, array $data = []): array
    {
        return ['sent' => 0, 'failed' => count($tokens)];
    }
}
