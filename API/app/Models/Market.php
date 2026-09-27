<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Market extends Model
{
    protected $fillable = [
        'name',
        'location',
        'address',
        'latitude',
        'longitude',
        'status',
        'image',
        'cutoff_time',
        'cutoff_timezone',
    ];

    // status is a 3-state tri-value (0=inactive, 1=active, 2=coming_soon), not a
    // boolean — verified against live data (20 inactive, 2 active, 8 coming_soon).
    // Casting it to boolean would silently coerce 2 (coming_soon) to true.
    protected function casts(): array
    {
        return [
            'latitude' => 'decimal:7',
            'longitude' => 'decimal:7',
            'status' => 'integer',
        ];
    }

    public function items()
    {
        return $this->belongsToMany(Item::class, 'market_items')
            ->withPivot(['is_available', 'cutoff_time', 'cutoff_timezone']);
    }

    public function itemPrices()
    {
        return $this->hasMany(ItemPrice::class);
    }

    public function orders()
    {
        return $this->hasMany(Order::class);
    }

    public function users()
    {
        return $this->hasMany(User::class);
    }

    public function palutoStalls()
    {
        return $this->hasMany(PalutoStall::class);
    }
}
