<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Schema;

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
        'is_bulk',
        'regular_price',
        'vendor_list_price',
        'vendor_price',
        'vendor_note',
        'vendor_price_by',
        'vendor_price_at',
        'subtotal',
    ];

    private static ?bool $hasVendorColumns = null;

    /** Until the vendor-price migration runs, checkout must not write those columns. */
    public static function hasVendorColumns(): bool
    {
        return self::$hasVendorColumns ??= Schema::hasColumn('order_items', 'vendor_list_price');
    }

    protected function casts(): array
    {
        return [
            'quantity' => 'decimal:3',
            'weight_kg' => 'decimal:3',
            'price' => 'decimal:2',
            'price_at_purchase' => 'decimal:2',
            'subtotal' => 'decimal:2',
            'vendor_list_price' => 'decimal:2',
            'vendor_price' => 'decimal:2',
            'vendor_price_at' => 'datetime',
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
