<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PalutoDishIngredient extends Model
{
    protected $fillable = [
        'paluto_dish_id',
        'item_id',
        'kind',
        'quantity',
        'unit_id',
        'is_optional',
        'is_provided',
        'note',
        'sort_order',
    ];

    protected function casts(): array
    {
        return [
            'quantity' => 'decimal:3',
            'is_optional' => 'boolean',
            'is_provided' => 'boolean',
        ];
    }

    public function dish()
    {
        return $this->belongsTo(PalutoDish::class, 'paluto_dish_id');
    }

    public function item()
    {
        return $this->belongsTo(Item::class);
    }

    public function unit()
    {
        return $this->belongsTo(Unit::class);
    }
}
