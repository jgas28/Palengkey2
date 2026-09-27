<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage;

class ItemImage extends Model
{
    protected $fillable = ['item_id', 'image_path', 'sort_order'];

    protected $appends = ['image_url'];

    public function item()
    {
        return $this->belongsTo(Item::class);
    }

    public function getImageUrlAttribute(): ?string
    {
        if (! $this->image_path) {
            return null;
        }

        $disk = config('filesystems.disks.s3.key') ? 's3' : 'public';

        try {
            return Storage::disk($disk)->url($this->image_path);
        } catch (\Throwable) {
            return null;
        }
    }
}
