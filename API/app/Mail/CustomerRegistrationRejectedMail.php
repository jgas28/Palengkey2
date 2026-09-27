<?php

namespace App\Mail;

use App\Models\Customer;
use Illuminate\Mail\Mailable;

class CustomerRegistrationRejectedMail extends Mailable
{
    public function __construct(
        public readonly Customer $customer,
        public readonly string $reason,
    ) {}

    public function build(): self
    {
        return $this->subject('Your Palengkey registration was not approved')
            ->view('emails.customer-registration-rejected')
            ->with(['customer' => $this->customer, 'reason' => $this->reason]);
    }
}
