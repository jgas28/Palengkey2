<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage;

class Item extends Model
{
    protected $fillable = [
        'name',
        'description',
        'picture_url',
        'category_id',
        'type_id',
        'unit_id',
        'bulk_min_kg',
        'status',
        'cutoff_time',
        'cutoff_timezone',
    ];

    protected function casts(): array
    {
        return [
            'status' => 'boolean',
            'bulk_min_kg' => 'decimal:3',
            'cutoff_time' => 'datetime:H:i',
        ];
    }

    public function category()
    {
        return $this->belongsTo(Category::class);
    }

    public function type()
    {
        return $this->belongsTo(Type::class);
    }

    public function unit()
    {
        return $this->belongsTo(Unit::class);
    }

    public function prices()
    {
        return $this->hasMany(ItemPrice::class);
    }

    public function images()
    {
        return $this->hasMany(ItemImage::class)->orderBy('sort_order');
    }

    public function markets()
    {
        return $this->belongsToMany(Market::class, 'market_items')
            ->withPivot(['is_available', 'cutoff_time', 'cutoff_timezone'])
            ->withTimestamps();
    }

    public function snapshotForMarket(int $marketId): ?MarketPriceSnapshot
    {
        return MarketPriceSnapshot::where('market_id', $marketId)
            ->where('item_id', $this->id)
            ->first();
    }

    public function hasPriceHistory(): bool
    {
        return $this->prices()->exists();
    }

    public function getImageFullUrlAttribute(): ?string
    {
        if (! $this->picture_url) {
            return null;
        }

        $disk = config('filesystems.disks.s3.key') ? 's3' : 'public';

        try {
            return Storage::disk($disk)->url($this->picture_url);
        } catch (\Throwable) {
            return null;
        }
    }

    private function settingValue(string $key, mixed $default): mixed
    {
        try {
            return Setting::get($key, $default) ?? $default;
        } catch (\Throwable) {
            return $default;
        }
    }

    public function getOperationalStartTimeString(): string
    {
        return $this->normalizeTimeString(
            $this->settingValue('order_operational_start_time', '05:00'),
            '05:00'
        );
    }

    /**
     * Cutoff-time precedence: per-market item override > market default > item's own
     * cutoff_time > system-wide setting.
     */
    public function getCutoffTimeStringForMarketData($marketItemPivot, ?Market $market): string
    {
        if ($marketItemPivot && $marketItemPivot->cutoff_time) {
            return $this->normalizeTimeString($marketItemPivot->cutoff_time, '17:00');
        }

        if ($market && $market->cutoff_time) {
            return $this->normalizeTimeString($market->cutoff_time, '17:00');
        }

        if ($this->cutoff_time) {
            return $this->normalizeTimeString($this->cutoff_time->format('H:i'), '17:00');
        }

        return $this->normalizeTimeString($this->settingValue('order_cutoff_time', '17:00'), '17:00');
    }

    public function isPastCutoffForMarketData($marketItemPivot, ?Market $market, $now = null): bool
    {
        $timezone = $marketItemPivot?->cutoff_timezone
            ?? $market?->cutoff_timezone
            ?? 'Asia/Manila';

        $current = $now
            ? \Carbon\Carbon::parse($now)->timezone($timezone)
            : now($timezone);

        $opening = $current->copy()->setTimeFromTimeString($this->getOperationalStartTimeString());
        $cutoff = $current->copy()->setTimeFromTimeString($this->getCutoffTimeStringForMarketData($marketItemPivot, $market));

        return $current->lt($opening) || $current->greaterThanOrEqualTo($cutoff);
    }

    public function getCutoffTimeStringForMarket(int $marketId): string
    {
        $pivot = $this->markets()->where('market_id', $marketId)->first()?->pivot;

        return $this->getCutoffTimeStringForMarketData($pivot, Market::find($marketId));
    }

    public function isPastCutoffForMarket(int $marketId, $now = null): bool
    {
        $pivot = $this->markets()->where('market_id', $marketId)->first()?->pivot;

        return $this->isPastCutoffForMarketData($pivot, Market::find($marketId), $now);
    }

    private function normalizeTimeString(mixed $value, string $fallback): string
    {
        $raw = trim((string) ($value ?: $fallback));

        if (preg_match('/^(\d{1,2}):(\d{2})(?::\d{2})?$/', $raw, $matches)) {
            $hour = (int) $matches[1];
            $minute = (int) $matches[2];

            if ($hour >= 0 && $hour <= 23 && $minute >= 0 && $minute <= 59) {
                return sprintf('%02d:%02d', $hour, $minute);
            }
        }

        return $fallback;
    }
}
