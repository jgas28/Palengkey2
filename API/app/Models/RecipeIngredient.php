<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class RecipeIngredient extends Model
{
    protected $fillable = [
        'recipe_id',
        'item_id',
        'kind',
        'quantity',
        'unit_id',
        'is_optional',
        'note',
        'sort_order',
    ];

    protected function casts(): array
    {
        return [
            'quantity' => 'decimal:3',
            'is_optional' => 'boolean',
        ];
    }

    /**
     * Ingredient kind follows the item's category (recipes and paluto dishes):
     * vegetables/fruits → vegetable, spices/herbs → spice, grocery/condiments →
     * condiment, everything else (meat, poultry, fish, seafood, frozen) → meat.
     */
    public static function kindForCategory(?string $category): string
    {
        $name = strtolower((string) $category);

        return match (true) {
            (bool) preg_match('/vegetable|fruit/', $name) => 'vegetable',
            (bool) preg_match('/spice|herb/', $name) => 'spice',
            (bool) preg_match('/grocery|condiment|sauce/', $name) => 'condiment',
            default => 'meat',
        };
    }

    public function recipe()
    {
        return $this->belongsTo(Recipe::class);
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
