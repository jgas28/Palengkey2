<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * Denormalized "current price" cache per (market_id, item_id) — one row per pair,
 * kept in sync whenever a price is entered/voided. This is the source of truth for
 * "what does this item cost right now at this market", not a raw item_prices scan.
 */
class MarketPriceSnapshot extends Model
{
    public $timestamps = false;

    protected $fillable = ['market_id', 'item_id', 'unit_id', 'price', 'price_at', 'is_available'];

    protected function casts(): array
    {
        return [
            'price' => 'decimal:2',
            'price_at' => 'datetime',
            'is_available' => 'boolean',
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
