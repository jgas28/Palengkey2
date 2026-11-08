<?php

namespace App\Services;

use App\Mail\CustomerAccountDeletionMail;
use App\Mail\CustomerForgotPasswordMail;
use App\Mail\CustomerOtpMail;
use App\Models\Customer;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

/** Customer one-time codes by email, or by SMS through Semaphore. */
class CustomerOtpService
{
    public function __construct(private SemaphoreSmsService $sms) {}

    /**
     * @return array{delivered: bool, error?: string}
     */
    private function sendSms(Customer $customer, string $otp, string $purpose, int $expiresInMinutes): array
    {
        $number = PhoneNumber::normalizePhilippineMobile($customer->phone);
        if (! $number || ! preg_match(PhoneNumber::PHILIPPINE_E164_REGEX, $number)) {
            return ['delivered' => false, 'error' => 'No valid mobile number on file to text the code to.'];
        }

        // Semaphore puts the code where {otp} is.
        $result = $this->sms->sendOtp(
            $number,
            "Your Palengkey {$purpose} code is {otp}. It expires in {$expiresInMinutes} minutes. Don't share it with anyone.",
            $otp,
        );

        if (! $result['successful']) {
            Log::error('Failed to send customer OTP SMS.', ['customer_id' => $customer->id, 'purpose' => $purpose]);

            return ['delivered' => false, 'error' => $result['message']];
        }

        return ['delivered' => true];
    }

    /**
     * @return array{delivered: bool, error?: string}
     */
    public function sendVerificationCode(Customer $customer, string $otp, int $expiresInMinutes, ?string $channel): array
    {
        if ($channel === 'sms') {
            return $this->sendSms($customer, $otp, 'verification', $expiresInMinutes);
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
            return $this->sendSms($customer, $otp, 'password reset', $expiresInMinutes);
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
            return $this->sendSms($customer, $otp, 'account deletion', $expiresInMinutes);
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
