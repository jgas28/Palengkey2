<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage;

class PopupAd extends Model
{
    protected $fillable = [
        'type',
        'voucher_id',
        'title',
        'subtitle',
        'body',
        'badge_text',
        'cta_label',
        'cta_url',
        'image_path',
        'is_active',
        'starts_at',
        'ends_at',
        'sort_order',
        'created_by',
    ];

    protected function casts(): array
    {
        return [
            'voucher_id' => 'integer',
            'is_active' => 'boolean',
            'starts_at' => 'datetime',
            'ends_at' => 'datetime',
            'sort_order' => 'integer',
        ];
    }

    public const TYPES = [
        'promo' => 'Promo',
        'voucher' => 'Voucher',
        'advertisement' => 'Advertisement',
    ];

    public function voucher()
    {
        return $this->belongsTo(Voucher::class);
    }

    public function createdBy()
    {
        return $this->belongsTo(User::class, 'created_by');
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

    public function getTypeLabelAttribute(): string
    {
        return self::TYPES[$this->type] ?? ucfirst($this->type);
    }

    public function scopeActiveForDisplay(Builder $query): Builder
    {
        $now = now();

        return $query
            ->where('is_active', true)
            ->where(fn (Builder $q) => $q->whereNull('starts_at')->orWhere('starts_at', '<=', $now))
            ->where(fn (Builder $q) => $q->whereNull('ends_at')->orWhere('ends_at', '>=', $now))
            ->orderBy('sort_order')
            ->orderByDesc('created_at');
    }
}
