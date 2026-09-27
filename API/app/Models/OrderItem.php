<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class OrderItem extends Model
{
    protected $fillable = [
        'order_id',
        'order_recipe_bundle_id',
        'item_id',
        'item_name',
        'unit_name',
        'quantity',
        'selected_size',
        'customer_note',
        'weight_kg',
        'item_quantity',
        'price',
        'price_at_purchase',
        'subtotal',
    ];

    protected function casts(): array
    {
        return [
            'quantity' => 'decimal:3',
            'weight_kg' => 'decimal:3',
            'price' => 'decimal:2',
            'price_at_purchase' => 'decimal:2',
            'subtotal' => 'decimal:2',
        ];
    }

    public function order()
    {
        return $this->belongsTo(Order::class);
    }

    public function item()
    {
        return $this->belongsTo(Item::class);
    }

    public function recipeBundle()
    {
        return $this->belongsTo(OrderRecipeBundle::class, 'order_recipe_bundle_id');
    }
}
