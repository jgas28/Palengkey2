<?php

namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class Customer extends Authenticatable
{
    use HasApiTokens, Notifiable;

    protected $fillable = [
        'fname',
        'lname',
        'mname',
        'email',
        'password',
        'google_id',
        'provider',
        'phone',
        'email_verified_at',
        'phone_verified_at',
        'token_version',
        'otp_code',
        'otp_expires_at',
        'otp_attempts',
        'otp_last_sent_at',
        'verification_status',
        'verified_at',
        'verified_by',
        'rejection_reason',
        'rejected_at',
        'notification_preferences',
        'identity_verification_skipped_at',
        'cod_details_completed_at',
        'id_verification_status',
    ];

    protected $hidden = [
        'password',
        'remember_token',
        'otp_code',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'phone_verified_at' => 'datetime',
            'otp_expires_at' => 'datetime',
            'otp_last_sent_at' => 'datetime',
            'verified_at' => 'datetime',
            'rejected_at' => 'datetime',
            'identity_verification_skipped_at' => 'datetime',
            'cod_details_completed_at' => 'datetime',
            'notification_preferences' => 'array',
            'password' => 'hashed',
        ];
    }

    public function devices()
    {
        return $this->hasMany(CustomerDevice::class);
    }

    public function cart()
    {
        return $this->hasOne(Cart::class);
    }

    public function addresses()
    {
        return $this->hasMany(CustomerAddress::class);
    }

    public function orders()
    {
        return $this->hasMany(Order::class);
    }

    public function supportThreads()
    {
        return $this->hasMany(SupportThread::class);
    }

    public function idSubmissions()
    {
        return $this->hasMany(IdSubmission::class);
    }

    public function verifications()
    {
        return $this->hasMany(CustomerVerification::class);
    }

    public function latestVerification()
    {
        return $this->hasOne(CustomerVerification::class)->latestOfMany();
    }

    public function verifiedBy()
    {
        return $this->belongsTo(User::class, 'verified_by');
    }

    /**
     * Customers whose latest verification submission is still awaiting admin review.
     * Mirrors the "pending" filter on the Registration Approvals list so dashboard
     * counts always match what that page shows.
     */
    public function scopePendingVerification($query)
    {
        return $query->where(function ($q) {
            $q->whereIn('verification_status', ['pending', 'pending_admin_approval'])
                ->orWhere('id_verification_status', 'pending_review')
                ->orWhereHas('latestVerification', function ($v) {
                    $v->where('status', 'pending');
                });
        });
    }

    /**
     * COD (cash-on-delivery) orders require a per-order ID-approval flow only for
     * customers who skipped the general identity-verification onboarding step —
     * mirrors App\Models\Customer::requiresCodApproval() in the reference backend.
     */
    public function skippedIdentityVerification(): bool
    {
        return ! is_null($this->identity_verification_skipped_at);
    }

    public function requiresCodApproval(): bool
    {
        return $this->skippedIdentityVerification()
            && $this->id_verification_status !== 'approved';
    }

    public function hasPendingCodApproval(): bool
    {
        if (! $this->requiresCodApproval()) {
            return false;
        }

        if ($this->id_verification_status === 'pending_review') {
            return true;
        }

        return $this->idSubmissions()->where('status', 'pending')->exists();
    }

    public function needsCodDetailsCompletion(): bool
    {
        return $this->requiresCodApproval() && ! $this->hasPendingCodApproval();
    }

    public function verificationFlags(): array
    {
        return [
            'id_verification_status' => $this->id_verification_status,
            'requires_cod_verification' => $this->requiresCodApproval(),
            'cod_verification_pending' => $this->hasPendingCodApproval(),
            'needs_cod_details' => $this->needsCodDetailsCompletion(),
        ];
    }
}
