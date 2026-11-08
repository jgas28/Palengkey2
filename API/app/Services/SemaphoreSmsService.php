<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * Semaphore (PH SMS gateway): https://semaphore.co/docs
 *
 * Needs SEMAPHORE_API_KEY (and optionally SEMAPHORE_SENDERNAME, an approved
 * sender name) in .env, read through config/services.php.
 */
class SemaphoreSmsService
{
    private const BASE_URL = 'https://api.semaphore.co/api/v4';

    /** Semaphore takes up to 1,000 numbers per request. */
    private const MAX_NUMBERS_PER_REQUEST = 1000;

    public function isConfigured(): bool
    {
        return filled(config('services.semaphore.api_key'));
    }

    /**
     * Bulk message (marketing blasts).
     *
     * @param  string[]  $numbers  +63XXXXXXXXXX
     * @return array{successful: bool, message: string}
     */
    public function sendMessage(array $numbers, string $message, ?string $senderName = null): array
    {
        if (! $this->isConfigured()) {
            return ['successful' => false, 'message' => 'SMS delivery is not configured yet.'];
        }

        foreach (array_chunk($numbers, self::MAX_NUMBERS_PER_REQUEST) as $chunk) {
            $result = $this->post('/messages', [
                'number' => implode(',', array_map([$this, 'toSemaphoreNumber'], $chunk)),
                'message' => $message,
            ], $senderName);

            if (! $result['successful']) {
                return $result;
            }
        }

        return ['successful' => true, 'message' => 'SMS sent.'];
    }

    /**
     * One-time code over Semaphore's priority OTP route. `{otp}` in $message is
     * replaced with $otp by Semaphore.
     *
     * @return array{successful: bool, message: string}
     */
    public function sendOtp(string $number, string $message, string $otp): array
    {
        if (! $this->isConfigured()) {
            return ['successful' => false, 'message' => 'SMS delivery is not configured yet.'];
        }

        return $this->post('/otp', [
            'number' => $this->toSemaphoreNumber($number),
            'message' => $message,
            'code' => $otp,
        ]);
    }

    /** @return array{successful: bool, message: string} */
    private function post(string $path, array $payload, ?string $senderName = null): array
    {
        $payload['apikey'] = config('services.semaphore.api_key');
        $sender = $senderName ?: config('services.semaphore.sender_name');
        if (filled($sender)) {
            $payload['sendername'] = $sender;
        }

        try {
            $response = Http::asForm()->timeout(15)->post(self::BASE_URL.$path, $payload);
        } catch (\Throwable $e) {
            Log::error('Semaphore request failed.', ['path' => $path, 'error' => $e->getMessage()]);

            return ['successful' => false, 'message' => "We couldn't reach the SMS service. Please try again."];
        }

        // Success is a list of queued messages; errors come back as an object of
        // field => [messages] (or a plain message), sometimes with a 200 status.
        $body = $response->json();
        if ($response->successful() && is_array($body) && array_is_list($body) && isset($body[0]['message_id'])) {
            return ['successful' => true, 'message' => 'SMS sent.'];
        }

        Log::error('Semaphore rejected the SMS.', [
            'path' => $path,
            'status' => $response->status(),
            'body' => is_array($body) ? $body : mb_substr($response->body(), 0, 500),
        ]);

        return ['successful' => false, 'message' => "We couldn't send the SMS. Please try again or use email."];
    }

    /** Semaphore wants 63XXXXXXXXXX / 09XXXXXXXXX, not +63. */
    private function toSemaphoreNumber(string $number): string
    {
        return ltrim((string) PhoneNumber::normalizePhilippineMobile($number), '+');
    }
}
