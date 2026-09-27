<?php

namespace App\Services;

use App\Mail\CustomerAccountDeletionMail;
use App\Mail\CustomerForgotPasswordMail;
use App\Mail\CustomerOtpMail;
use App\Models\Customer;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

/**
 * Phase 1 only wires up email delivery. SMS (Semaphore) is a documented Phase 2
 * gap — callers must not silently pretend an sms-channel request succeeded.
 */
class CustomerOtpService
{
    public const UNSUPPORTED_SMS_MESSAGE = 'SMS delivery is not available yet. Please use email.';

    /**
     * @return array{delivered: bool, error?: string}
     */
    public function sendVerificationCode(Customer $customer, string $otp, int $expiresInMinutes, ?string $channel): array
    {
        if ($channel === 'sms') {
            return ['delivered' => false, 'error' => self::UNSUPPORTED_SMS_MESSAGE];
        }

        if (blank($customer->email)) {
            return ['delivered' => false, 'error' => 'No email on file to send the code to.'];
        }

        try {
            Mail::to($customer->email)->send(new CustomerOtpMail($otp, $customer->fname, $expiresInMinutes));

            return ['delivered' => true];
        } catch (\Throwable $e) {
            Log::error('Failed to send customer OTP email.', [
                'customer_id' => $customer->id,
                'error' => $e->getMessage(),
            ]);

            return ['delivered' => false, 'error' => "We couldn't send the code to your email. Please try again."];
        }
    }

    /**
     * @return array{delivered: bool, error?: string}
     */
    public function sendPasswordResetCode(Customer $customer, string $otp, int $expiresInMinutes, ?string $channel): array
    {
        if ($channel === 'sms') {
            return ['delivered' => false, 'error' => self::UNSUPPORTED_SMS_MESSAGE];
        }

        if (blank($customer->email)) {
            return ['delivered' => false, 'error' => 'No email on file to send the code to.'];
        }

        try {
            Mail::to($customer->email)->send(new CustomerForgotPasswordMail($otp, $expiresInMinutes));

            return ['delivered' => true];
        } catch (\Throwable $e) {
            Log::error('Failed to send customer password reset email.', [
                'customer_id' => $customer->id,
                'error' => $e->getMessage(),
            ]);

            return ['delivered' => false, 'error' => "We couldn't send the code to your email. Please try again."];
        }
    }

    /**
     * @return array{delivered: bool, error?: string}
     */
    public function sendAccountDeletionCode(Customer $customer, string $otp, int $expiresInMinutes, ?string $channel): array
    {
        if ($channel === 'sms') {
            return ['delivered' => false, 'error' => self::UNSUPPORTED_SMS_MESSAGE];
        }

        if (blank($customer->email)) {
            return ['delivered' => false, 'error' => 'No email on file to send the code to.'];
        }

        try {
            Mail::to($customer->email)->send(new CustomerAccountDeletionMail($otp, $customer->fname, $expiresInMinutes));

            return ['delivered' => true];
        } catch (\Throwable $e) {
            Log::error('Failed to send customer account deletion email.', [
                'customer_id' => $customer->id,
                'error' => $e->getMessage(),
            ]);

            return ['delivered' => false, 'error' => "We couldn't send the code to your email. Please try again."];
        }
    }
}
