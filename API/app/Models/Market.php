<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Schema;

class Market extends Model
{
    protected $fillable = [
        'name',
        'location',
        'address',
        'latitude',
        'longitude',
        'status',
        'image',
        'cutoff_time',
        'cutoff_timezone',
        'closed_until',
        'closed_reason',
    ];

    // status is a 3-state tri-value (0=inactive, 1=active, 2=coming_soon), not a
    // boolean — verified against live data (20 inactive, 2 active, 8 coming_soon).
    // Casting it to boolean would silently coerce 2 (coming_soon) to true.
    protected function casts(): array
    {
        return [
            'latitude' => 'decimal:7',
            'longitude' => 'decimal:7',
            'status' => 'integer',
            'closed_until' => 'datetime',
        ];
    }

    /** False until the closed_until migration has run on this database. */
    public static function supportsClosure(): bool
    {
        static $supported;

        return $supported ??= Schema::hasColumn('markets', 'closed_until');
    }

    /** "Close market": true until the reopen time set by an admin (Order Later only). */
    public function isClosedForOrders($now = null): bool
    {
        return $this->closed_until !== null
            && ($now ? Carbon::parse($now) : now())->lt($this->closed_until);
    }

    /** Start of the day it reopens, in the market's timezone; null when open. */
    public function reopenDay(): ?Carbon
    {
        return $this->isClosedForOrders()
            ? $this->closed_until->copy()->timezone($this->cutoff_timezone ?: 'Asia/Manila')->startOfDay()
            : null;
    }

    /** Paluto is cooked to order, so unlike items it can't wait as Order Later. */
    public function palutoClosedMessage(): string
    {
        $reopens = $this->closed_until->copy()->timezone($this->cutoff_timezone ?: 'Asia/Manila');

        return "{$this->name} is closed until {$reopens->format('M j')}, so Paluto can't be ordered right now.";
    }

    public function closurePayload(): array
    {
        if (! $this->isClosedForOrders()) {
            return ['is_closed' => false, 'closed_until' => null, 'reopens_on' => null, 'closed_reason' => null];
        }

        $reopens = $this->closed_until->copy()->timezone($this->cutoff_timezone ?: 'Asia/Manila');

        return [
            'is_closed' => true,
            'closed_until' => $reopens->toIso8601String(),
            'reopens_on' => $reopens->toDateString(),
            'closed_reason' => $this->closed_reason,
        ];
    }

    public function items()
    {
        return $this->belongsToMany(Item::class, 'market_items')
            ->withPivot(['is_available', 'cutoff_time', 'cutoff_timezone']);
    }

    public function itemPrices()
    {
        return $this->hasMany(ItemPrice::class);
    }

    public function orders()
    {
        return $this->hasMany(Order::class);
    }

    public function users()
    {
        return $this->hasMany(User::class);
    }

    public function palutoStalls()
    {
        return $this->hasMany(PalutoStall::class);
    }
}
