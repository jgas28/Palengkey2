<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class OrderFeedback extends Model
{
    protected $table = 'order_feedback';

    protected $fillable = [
        'order_id',
        'customer_id',
        'market_id',
        'rating',
        'comment',
        'is_anonymous',
        'status',
        'admin_notes',
        'reviewed_by',
        'reviewed_at',
    ];

    protected function casts(): array
    {
        return [
            'is_anonymous' => 'boolean',
            'reviewed_at' => 'datetime',
        ];
    }

    public function order()
    {
        return $this->belongsTo(Order::class);
    }

    public function customer()
    {
        return $this->belongsTo(Customer::class);
    }

    public function market()
    {
        return $this->belongsTo(Market::class);
    }

    public function reviewedBy()
    {
        return $this->belongsTo(User::class, 'reviewed_by');
    }

    public function getPublicCustomerNameAttribute(): string
    {
        if ($this->is_anonymous) {
            return 'Anonymous Suki';
        }

        $firstName = trim((string) ($this->customer?->fname ?? ''));

        return $firstName !== '' ? $firstName : 'Suki';
    }

    public function scopeFiveStar(\Illuminate\Database\Eloquent\Builder $query): \Illuminate\Database\Eloquent\Builder
    {
        return $query->where('rating', 5);
    }

    public function scopeBadReview(\Illuminate\Database\Eloquent\Builder $query): \Illuminate\Database\Eloquent\Builder
    {
        return $query->where('rating', '<=', 3);
    }
}
