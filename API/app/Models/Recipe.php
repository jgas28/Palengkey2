<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage;

class Recipe extends Model
{
    protected $fillable = [
        'name',
        'description',
        'steps',
        'tips',
        'image',
        'category_id',
        'recipe_type_id',
        'pricing_unit',
        'base_quantity',
        'status',
    ];

    protected function casts(): array
    {
        return [
            'base_quantity' => 'decimal:3',
            'status' => 'boolean',
            'steps' => 'array',
        ];
    }

    /** @deprecated — recipes now use recipeType() for Paluto's own cooking-style taxonomy. */
    public function category()
    {
        return $this->belongsTo(Category::class);
    }

    public function recipeType()
    {
        return $this->belongsTo(RecipeType::class);
    }

    public function ingredients()
    {
        return $this->hasMany(RecipeIngredient::class)->orderBy('sort_order');
    }

    public function stallRecipes()
    {
        return $this->hasMany(PalutoStallRecipe::class);
    }

    public function stalls()
    {
        return $this->belongsToMany(PalutoStall::class, 'paluto_stall_recipes')
            ->withPivot(['rate', 'minimum_fee', 'status'])
            ->withTimestamps();
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
