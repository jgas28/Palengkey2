<?php

namespace App\Mail;

use App\Models\Customer;
use App\Models\Voucher;
use Illuminate\Mail\Mailable;

/** Tells a customer about a voucher an admin made just for them. */
class VoucherAssignedMail extends Mailable
{
    public function __construct(
        public readonly Customer $customer,
        public readonly Voucher $voucher,
    ) {}

    public function build(): self
    {
        $voucher = $this->voucher;

        $discount = $voucher->discount_type === 'percentage'
            ? rtrim(rtrim(number_format($voucher->discount_value, 2), '0'), '.').'% off'
            : 'PHP '.number_format($voucher->discount_value, 2).' off';

        $details = array_filter([
            'Discount' => $discount.' your '.strtolower($voucher->applies_to_label),
            'Minimum order' => $voucher->min_order_amount ? 'PHP '.number_format($voucher->min_order_amount, 2) : null,
            'Up to' => $voucher->discount_type === 'percentage' && $voucher->max_discount_amount
                ? 'PHP '.number_format($voucher->max_discount_amount, 2) : null,
            'Market' => $voucher->market?->name,
            'Valid from' => $voucher->starts_at && $voucher->starts_at->isFuture()
                ? $voucher->starts_at->timezone('Asia/Manila')->format('M j, Y g:i A') : null,
            'Valid until' => $voucher->expires_at?->timezone('Asia/Manila')->format('M j, Y g:i A'),
            'Uses' => $voucher->perCustomerUsageLimit() > 1 ? $voucher->perCustomerUsageLimit().' times' : null,
        ]);

        return $this->subject('You have a Palengkey voucher: '.$voucher->code)
            ->view('emails.voucher-assigned')
            ->with([
                'customer' => $this->customer,
                'voucher' => $voucher,
                'details' => $details,
                'shopUrl' => rtrim((string) config('services.firebase.web_url'), '/').'/vouchers',
            ]);
    }
}
