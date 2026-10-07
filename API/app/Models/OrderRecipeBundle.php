<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * One row per cooked (or ingredients-only) recipe inside an order. recipe_name/
 * stall_name/rate_at_purchase are snapshots taken at order time, exactly like
 * OrderItem.item_name/price_at_purchase — editing/retiring a recipe or stall
 * later never rewrites order history.
 */
class OrderRecipeBundle extends Model
{
    protected $fillable = [
        'order_id',
        'recipe_id',
        'paluto_dish_id',
        'recipe_name',
        'paluto_stall_id',
        'stall_name',
        'quantity',
        'pricing_unit',
        'rate_at_purchase',
        'cooking_fee',
        'cooking_status',
    ];

    protected function casts(): array
    {
        return [
            'quantity' => 'decimal:3',
            'rate_at_purchase' => 'decimal:2',
            'cooking_fee' => 'decimal:2',
        ];
    }

    public function order()
    {
        return $this->belongsTo(Order::class);
    }

    public function recipe()
    {
        return $this->belongsTo(Recipe::class);
    }

    public function dish()
    {
        return $this->belongsTo(PalutoDish::class, 'paluto_dish_id');
    }

    public function stall()
    {
        return $this->belongsTo(PalutoStall::class, 'paluto_stall_id');
    }

    public function items()
    {
        return $this->hasMany(OrderItem::class, 'order_recipe_bundle_id');
    }
}
