<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CustomerDevice extends Model
{
    protected $fillable = [
        'customer_id',
        'device_name',
        'device_id',
        'platform',
        'fcm_token',
        'app_version',
        'token_id',
        'token_version',
        'last_used_at',
    ];

    protected function casts(): array
    {
        return ['last_used_at' => 'datetime'];
    }

    public function customer()
    {
        return $this->belongsTo(Customer::class);
    }
}
