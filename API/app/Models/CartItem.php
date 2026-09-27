<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CartItem extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'cart_id',
        'cart_recipe_bundle_id',
        'item_id',
        'market_id',
        'quantity',
        'weight_kg',
        'item_quantity',
        'selected_size',
        'customer_note',
        'price',
    ];

    protected function casts(): array
    {
        return [
            'quantity' => 'decimal:3',
            'weight_kg' => 'decimal:3',
            'price' => 'decimal:2',
        ];
    }

    public function cart()
    {
        return $this->belongsTo(Cart::class);
    }

    public function item()
    {
        return $this->belongsTo(Item::class);
    }

    public function market()
    {
        return $this->belongsTo(Market::class);
    }

    public function recipeBundle()
    {
        return $this->belongsTo(CartRecipeBundle::class, 'cart_recipe_bundle_id');
    }
}
