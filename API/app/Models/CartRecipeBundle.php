<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/** Same shape as OrderRecipeBundle but for the cart (pre-purchase). */
class CartRecipeBundle extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'cart_id',
        'recipe_id',
        'paluto_dish_id',
        'recipe_name',
        'paluto_stall_id',
        'stall_name',
        'quantity',
        'pricing_unit',
        'rate_at_purchase',
        'cooking_fee',
    ];

    protected function casts(): array
    {
        return [
            'quantity' => 'decimal:3',
            'rate_at_purchase' => 'decimal:2',
            'cooking_fee' => 'decimal:2',
        ];
    }

    public function cart()
    {
        return $this->belongsTo(Cart::class);
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
        return $this->hasMany(CartItem::class, 'cart_recipe_bundle_id');
    }
}
