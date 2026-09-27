<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class CustomerForgotPasswordMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public readonly string $otp,
        public readonly int $expiresInMinutes = 15,
    ) {}

    public function build(): self
    {
        return $this->subject('Reset your Palengkey password')
            ->view('emails.customer-forgot-password');
    }
}
