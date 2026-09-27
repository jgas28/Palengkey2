<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class CustomerOtpMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public readonly string $otp,
        public readonly string $firstName,
        public readonly int $expiresInMinutes = 10,
    ) {}

    public function build(): self
    {
        return $this->subject('Your Palengkey verification code')
            ->view('emails.customer-otp');
    }
}
