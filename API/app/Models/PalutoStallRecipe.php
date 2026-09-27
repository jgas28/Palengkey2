<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PalutoStallRecipe extends Model
{
    protected $fillable = [
        'paluto_stall_id',
        'recipe_id',
        'rate',
        'minimum_fee',
        'provided_ingredient_ids',
        'status',
    ];

    protected function casts(): array
    {
        return [
            'rate' => 'decimal:2',
            'minimum_fee' => 'decimal:2',
            'provided_ingredient_ids' => 'array',
            'status' => 'boolean',
        ];
    }

    public function stall()
    {
        return $this->belongsTo(PalutoStall::class, 'paluto_stall_id');
    }

    public function recipe()
    {
        return $this->belongsTo(Recipe::class);
    }
}
