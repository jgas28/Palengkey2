<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * Rows are never deleted, only voided (voided_at set) — "current price" for a
 * given (market_id, item_id) is the latest row where voided_at IS NULL.
 */
class ItemPrice extends Model
{
    protected $fillable = [
        'item_id',
        'market_id',
        'unit_id',
        'price',
        'voided_at',
        'voided_by',
    ];

    protected function casts(): array
    {
        return [
            'price' => 'decimal:2',
            'voided_at' => 'datetime',
        ];
    }

    public function item()
    {
        return $this->belongsTo(Item::class);
    }

    public function market()
    {
        return $this->belongsTo(Market::class);
    }

    public function unit()
    {
        return $this->belongsTo(Unit::class);
    }
}
