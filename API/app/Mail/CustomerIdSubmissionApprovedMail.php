<?php

namespace App\Mail;

use App\Models\Customer;
use App\Models\Order;
use Illuminate\Mail\Mailable;

class CustomerIdSubmissionApprovedMail extends Mailable
{
    public function __construct(
        public readonly Customer $customer,
        public readonly ?Order $order = null,
        public readonly ?string $reviewNotes = null,
    ) {}

    public function build(): self
    {
        $subject = $this->order
            ? 'Your ID has been verified — Order '.$this->order->order_number.' is confirmed'
            : 'Your ID has been verified for Cash on Delivery';

        return $this->subject($subject)
            ->view('emails.customer-id-submission-approved')
            ->with(['customer' => $this->customer, 'order' => $this->order, 'reviewNotes' => $this->reviewNotes]);
    }
}
