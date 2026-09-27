<?php

namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Laravel\Sanctum\HasApiTokens;

class Rider extends Authenticatable
{
    use HasApiTokens;

    protected $fillable = [
        'name',
        'phone',
        'vehicle_type',
        'is_active',
        'market_id',
        'current_latitude',
        'current_longitude',
        'last_location_update',
        'email',
        'password',
    ];

    protected $hidden = ['password', 'remember_token'];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
            'current_latitude' => 'decimal:8',
            'current_longitude' => 'decimal:8',
            'last_location_update' => 'datetime',
            'password' => 'hashed',
        ];
    }

    public function market()
    {
        return $this->belongsTo(Market::class);
    }

    public function orders()
    {
        return $this->hasMany(Order::class);
    }
}
