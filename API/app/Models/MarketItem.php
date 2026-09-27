<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MarketItem extends Model
{
    protected $fillable = ['market_id', 'item_id', 'is_available', 'cutoff_time', 'cutoff_timezone'];

    protected function casts(): array
    {
        return ['is_available' => 'boolean'];
    }

    public function market()
    {
        return $this->belongsTo(Market::class);
    }

    public function item()
    {
        return $this->belongsTo(Item::class);
    }
}
