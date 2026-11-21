<?php

namespace App\Services;

use App\Mail\VoucherAssignedMail;
use App\Models\Customer;
use App\Models\Voucher;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

/**
 * Emails the customers of a personal voucher about it, once each. Customers
 * already emailed (voucher_customers.notified_at) are skipped, so saving the
 * voucher again only emails customers added since. A failed email is retried
 * the next time the voucher is saved.
 */
class VoucherCustomerNotifier
{
    /**
     * Starts emailing everyone not told yet, after the response is sent so the
     * admin isn't kept waiting. Returns how many will be emailed and how many
     * were skipped (promotional emails turned off, or no valid email).
     *
     * @return array{sending: int, skipped: int}
     */
    public function notifyNew(Voucher $voucher): array
    {
        if (! $this->worthTelling($voucher)) {
            return ['sending' => 0, 'skipped' => 0];
        }

        $pending = $voucher->customers()
            ->wherePivotNull('notified_at')
            ->whereNotNull('customers.email')
            ->get(['customers.id', 'customers.email', 'customers.notification_preferences']);

        $recipients = $pending->filter(fn (Customer $c) => $this->wantsPromoEmail($c));
        $customerIds = $recipients->pluck('id')->all();

        if ($customerIds !== []) {
            $voucherId = $voucher->id;
            dispatch(fn () => app(self::class)->send($voucherId, $customerIds))->afterResponse();
        }

        return ['sending' => count($customerIds), 'skipped' => $pending->count() - count($customerIds)];
    }

    /** Sends the emails now. Each customer is claimed first so two saves at once can't both email them. */
    public function send(int $voucherId, array $customerIds): void
    {
        $voucher = Voucher::with('market')->find($voucherId);
        if (! $voucher || ! $this->worthTelling($voucher)) {
            return;
        }

        if (function_exists('set_time_limit')) {
            @set_time_limit(0);
        }

        $sent = 0;
        $failed = 0;

        foreach (Customer::whereIn('id', $customerIds)->get() as $customer) {
            $claimed = DB::table('voucher_customers')
                ->where('voucher_id', $voucherId)
                ->where('customer_id', $customer->id)
                ->whereNull('notified_at')
                ->update(['notified_at' => now()]);

            if ($claimed !== 1) {
                continue; // removed from the voucher, or already emailed
            }

            try {
                Mail::to($customer->email)->send(new VoucherAssignedMail($customer, $voucher));
                $sent++;
            } catch (\Throwable $e) {
                $failed++;
                DB::table('voucher_customers')
                    ->where('voucher_id', $voucherId)
                    ->where('customer_id', $customer->id)
                    ->update(['notified_at' => null]);
                Log::warning('Voucher email failed.', ['voucher_id' => $voucherId, 'customer_id' => $customer->id, 'error' => $e->getMessage()]);
            }
        }

        Log::info('Personal voucher emails sent.', ['voucher_id' => $voucherId, 'sent' => $sent, 'failed' => $failed]);
    }

    /** Only a personal voucher that is on and can still be used. One that starts later is fine: the email says when. */
    private function worthTelling(Voucher $voucher): bool
    {
        return $voucher->for_specific_customers
            && $voucher->is_active
            && ! ($voucher->expires_at && $voucher->expires_at->isPast())
            && $voucher->hasGlobalUsesRemaining();
    }

    /** Same opt-out rule as the marketing email blast. */
    private function wantsPromoEmail(Customer $customer): bool
    {
        $preferences = $customer->notification_preferences ?? [];

        return filter_var($customer->email, FILTER_VALIDATE_EMAIL) !== false
            && (bool) ($preferences['promotions'] ?? true)
            && (bool) ($preferences['email_notifications'] ?? true);
    }
}
