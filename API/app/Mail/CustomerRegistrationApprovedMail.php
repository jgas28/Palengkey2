<?php

namespace App\Mail;

use App\Models\Customer;
use Illuminate\Mail\Mailable;

class CustomerRegistrationApprovedMail extends Mailable
{
    public function __construct(
        public readonly Customer $customer,
        public readonly ?string $reviewNotes = null,
    ) {}

    public function build(): self
    {
        return $this->subject('Your Palengkey registration has been approved')
            ->view('emails.customer-registration-approved')
            ->with(['customer' => $this->customer, 'reviewNotes' => $this->reviewNotes]);
    }
}
