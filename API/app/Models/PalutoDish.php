<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage;

/**
 * One dish on a Paluto stall's menu, with its own ingredient list (BOM) and
 * cooking fee. Deliberately independent of the Recipes catalog — two stalls
 * cooking "the same dish" use different ingredients, quantities and fees.
 */
class PalutoDish extends Model
{
    protected $fillable = [
        'paluto_stall_id',
        'name',
        'description',
        'image',
        'recipe_type_id',
        'pricing_unit',
        'base_quantity',
        'rate',
        'minimum_fee',
        'status',
        'sort_order',
    ];

    protected function casts(): array
    {
        return [
            'base_quantity' => 'decimal:3',
            'rate' => 'decimal:2',
            'minimum_fee' => 'decimal:2',
            'status' => 'boolean',
            'sort_order' => 'integer',
        ];
    }

    public function stall()
    {
        return $this->belongsTo(PalutoStall::class, 'paluto_stall_id');
    }

    public function recipeType()
    {
        return $this->belongsTo(RecipeType::class);
    }

    public function ingredients()
    {
        return $this->hasMany(PalutoDishIngredient::class)->orderBy('sort_order');
    }

    /** round(max(rate × quantity, minimum_fee), 2) — the one cooking-fee formula, shared by cart and checkout. */
    public function cookingFeeFor(float $quantity): float
    {
        return round(max((float) $this->rate * $quantity, (float) ($this->minimum_fee ?? 0)), 2);
    }

    public function getImageFullUrlAttribute(): ?string
    {
        if (! $this->image) {
            return null;
        }

        $disk = config('filesystems.disks.s3.key') ? 's3' : 'public';

        try {
            return Storage::disk($disk)->url($this->image);
        } catch (\Throwable) {
            return null;
        }
    }
}
