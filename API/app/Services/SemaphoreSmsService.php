<?php

namespace App\Services;

/**
 * Placeholder — Semaphore (PH SMS gateway) credentials aren't configured yet.
 * stats() endpoints that only count customers work fully; send() reports a
 * clear failure rather than silently pretending to deliver anything.
 */
class SemaphoreSmsService
{
    public function sendMessage(array $numbers, string $message, ?string $senderName = null): array
    {
        return ['successful' => false, 'message' => 'SMS delivery is not configured yet.'];
    }

    public function sendOtp(string $number, string $message, string $otp): array
    {
        return ['successful' => false, 'message' => 'SMS delivery is not configured yet.'];
    }
}
