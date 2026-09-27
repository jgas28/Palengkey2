<?php

namespace App\Services;

use App\Models\Customer;
use App\Models\DeletedAccountCooldown;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

/**
 * Scrubs a customer's personal data (name, email, phone, password, Google
 * link, profile image, saved addresses, ID/KYC documents) and revokes all
 * sessions/tokens. Orders, order items, and payment records are left
 * untouched — they carry their own snapshot of contact/address info and
 * stay linked via customer_id for financial/tax filing.
 */
class CustomerAccountDeletionService
{
    public function hasBlockingOrders(Customer $customer): bool
    {
        // Cashless orders (BPI/QR Ph) stay at status "pending_payment" until
        // paid or expired, so an unresolved payment is already covered by the
        // status check below. COD orders never flip payment_status from
        // "pending" to "paid" even after delivery, so payment_status alone
        // isn't a reliable signal here.
        return $customer->orders()
            ->whereNotIn('status', ['delivered', 'cancelled'])
            ->exists();
    }

    public function delete(Customer $customer): void
    {
        $originalEmail = $customer->email;
        $originalPhone = $customer->phone;
        $disk = $this->disk();

        DB::transaction(function () use ($customer, $originalEmail, $originalPhone, $disk) {
            $customer->tokens()->delete();
            $customer->devices()->delete();
            $customer->addresses()->delete();

            // The customer row itself gets anonymized below, so this cooldown
            // record is the only thing left tying the deletion back to the
            // original identity — blocks re-registration for COOLDOWN_DAYS.
            DeletedAccountCooldown::create([
                'email' => strtolower($originalEmail),
                'phone' => $originalPhone,
                'deleted_at' => now(),
                'expires_at' => now()->addDays(DeletedAccountCooldown::COOLDOWN_DAYS),
            ]);

            foreach ($customer->idSubmissions as $submission) {
                $this->deleteIfExists($disk, $submission->id_document_path);
                $this->deleteIfExists($disk, $submission->selfie_path);
            }
            $customer->idSubmissions()->delete();

            foreach ($customer->verifications as $verification) {
                $this->deleteIfExists($disk, $verification->id_document_path);
                $this->deleteIfExists($disk, $verification->selfie_path);
            }
            $customer->verifications()->delete();

            $profileFolder = 'customers/'.$customer->id.'/profile_image';
            if (Storage::disk($disk)->exists($profileFolder)) {
                Storage::disk($disk)->deleteDirectory($profileFolder);
            }

            $customer->update([
                'fname' => 'Deleted',
                'lname' => 'User',
                'mname' => null,
                'email' => 'deleted+'.$customer->id.'@palengkey.invalid',
                'phone' => null,
                'password' => Hash::make(Str::random(40)),
                'google_id' => null,
                'provider' => null,
                'notification_preferences' => null,
                'otp_code' => null,
                'otp_expires_at' => null,
                'otp_attempts' => 0,
                'otp_last_sent_at' => null,
            ]);
        });
    }

    /** Same disk-resolution rule as CustomerProfileController — S3 when configured, local `public` disk otherwise. */
    private function disk(): string
    {
        return config('filesystems.disks.s3.key') ? 's3' : 'public';
    }

    private function deleteIfExists(string $disk, ?string $path): void
    {
        if ($path && Storage::disk($disk)->exists($path)) {
            Storage::disk($disk)->delete($path);
        }
    }
}
