<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/** A customer's PWD or Senior Citizen ID, checked once by an admin before the discount can be used. */
class DiscountId extends Model
{
    public const TYPES = [
        'pwd' => 'PWD',
        'senior' => 'Senior Citizen',
    ];

    protected $fillable = [
        'customer_id',
        'type',
        'id_number',
        'full_name',
        'disk',
        'front_path',
        'back_path',
        'selfie_path',
        'status',
        'review_notes',
        'reviewed_by',
        'reviewed_at',
    ];

    protected $hidden = ['disk', 'front_path', 'back_path', 'selfie_path'];

    protected function casts(): array
    {
        return ['reviewed_at' => 'datetime'];
    }

    public function customer()
    {
        return $this->belongsTo(Customer::class);
    }

    public function reviewer()
    {
        return $this->belongsTo(User::class, 'reviewed_by');
    }

    /** The customer's approved ID, if any. */
    public static function approvedFor(int $customerId): ?self
    {
        return self::where('customer_id', $customerId)->where('status', 'approved')->latest('id')->first();
    }

    public function typeLabel(): string
    {
        return self::TYPES[$this->type] ?? $this->type;
    }
}
