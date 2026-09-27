<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage;

class Category extends Model
{
    protected $fillable = ['name', 'image', 'status'];

    protected function casts(): array
    {
        return ['status' => 'boolean'];
    }

    public function items()
    {
        return $this->hasMany(Item::class);
    }

    public function activeItems()
    {
        return $this->items()->where('status', 1);
    }

    public function scopeActive($query)
    {
        return $query->where('status', 1);
    }

    public function canDeactivate(): bool
    {
        return ! $this->activeItems()->exists();
    }

    public function deactivate(): bool
    {
        return $this->canDeactivate() && $this->update(['status' => 0]);
    }

    public function restore(): bool
    {
        return $this->update(['status' => 1]);
    }

    public function getImageUrlAttribute(): ?string
    {
        if (! $this->image) {
            return null;
        }

        $disk = config('filesystems.disks.s3.key') ? 's3' : 'public';

        try {
            return Storage::disk($disk)->exists($this->image)
                ? Storage::disk($disk)->url($this->image)
                : null;
        } catch (\Throwable) {
            return null;
        }
    }
}
