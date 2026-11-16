<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CashlessPayment extends Model
{
    protected $fillable = [
        'order_id',
        'provider',
        'method',
        'reference',
        'qr_url',
        'redirect_url',
        'amount',
        'currency',
        'status',
        'raw_response',
    ];

    /** PayMongo's full responses (client key, billing details) stay server-side. */
    protected $hidden = ['raw_response'];

    protected function casts(): array
    {
        return [
            'amount' => 'decimal:2',
            'raw_response' => 'array',
        ];
    }

    public function order()
    {
        return $this->belongsTo(Order::class);
    }
}
