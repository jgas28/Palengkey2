<?php

namespace App\Mail;

use App\Models\Customer;
use App\Models\Order;
use Illuminate\Mail\Mailable;

class CustomerIdSubmissionRejectedMail extends Mailable
{
    public function __construct(
        public readonly Customer $customer,
        public readonly ?Order $order = null,
        public readonly ?string $reason = null,
    ) {}

    public function build(): self
    {
        $subject = $this->order
            ? 'Action required: ID rejected for Order '.$this->order->order_number
            : 'Action required: your Cash on Delivery ID was not approved';

        return $this->subject($subject)
            ->view('emails.customer-id-submission-rejected')
            ->with(['customer' => $this->customer, 'order' => $this->order, 'reason' => $this->reason]);
    }
}
