<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * One cart per customer (not per market — cart_items carries its own market_id
 * per row, verified against the live schema; the "one cart per market" design
 * implied by an older migration was since dropped in favor of this).
 *
 * A cart with a null customer_id is a guest cart, keyed by device_id instead —
 * merged into the customer's own cart on login/register.
 */
class Cart extends Model
{
    protected $fillable = ['customer_id', 'device_id'];

    public function customer()
    {
        return $this->belongsTo(Customer::class);
    }

    public function items()
    {
        return $this->hasMany(CartItem::class);
    }

    public function recipeBundles()
    {
        return $this->hasMany(CartRecipeBundle::class);
    }
}
