<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage;

class PalutoStall extends Model
{
    protected $fillable = [
        'market_id',
        'name',
        'description',
        'image',
        'contact_phone',
        'status',
        'is_accepting_orders',
        'prep_time_minutes',
    ];

    protected function casts(): array
    {
        return [
            'status' => 'boolean',
            'is_accepting_orders' => 'boolean',
            'prep_time_minutes' => 'integer',
        ];
    }

    public function market()
    {
        return $this->belongsTo(Market::class);
    }

    public function stallRecipes()
    {
        return $this->hasMany(PalutoStallRecipe::class);
    }

    public function recipes()
    {
        return $this->belongsToMany(Recipe::class, 'paluto_stall_recipes')
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
