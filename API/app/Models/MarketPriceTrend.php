<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MarketPriceTrend extends Model
{
    public $timestamps = false;

    protected $fillable = ['market_id', 'item_id', 'price', 'price_date'];

    protected function casts(): array
    {
        return [
            'price' => 'decimal:2',
            'price_date' => 'date',
        ];
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
