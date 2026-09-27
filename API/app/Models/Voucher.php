<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;

class Voucher extends Model
{
    protected $fillable = [
        'code',
        'description',
        'discount_type',
        'discount_value',
        'applies_to',
        'min_order_amount',
        'max_discount_amount',
        'usage_limit',
        'per_customer_limit',
        'used_count',
        'is_active',
        'is_public',
        'market_id',
        'starts_at',
        'expires_at',
        'created_by',
    ];

    protected $casts = [
        'discount_value' => 'float',
        'min_order_amount' => 'float',
        'max_discount_amount' => 'float',
        'usage_limit' => 'integer',
        'per_customer_limit' => 'integer',
        'used_count' => 'integer',
        'is_active' => 'boolean',
        'is_public' => 'boolean',
        'starts_at' => 'datetime',
        'expires_at' => 'datetime',
        'applies_to' => 'array',
    ];

    public const TARGETS = [
        'subtotal' => 'Items Subtotal',
        'service_fee' => 'Service Fee',
        'delivery_fee' => 'Delivery Fee',
    ];

    public function usages()
    {
        return $this->hasMany(VoucherUsage::class);
    }

    public function market()
    {
        return $this->belongsTo(Market::class);
    }

    public function createdBy()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function appliesToMarket(?int $marketId): bool
    {
        return $this->market_id === null || $this->market_id === $marketId;
    }

    public function appliesToTarget(string $target): bool
    {
        return in_array($target, $this->applies_to ?? []);
    }

    public function isValid(): bool
    {
        if (! $this->is_active) {
            return false;
        }

        $now = now();
        if ($this->starts_at && $now->lt($this->starts_at)) {
            return false;
        }
        if ($this->expires_at && $now->gt($this->expires_at)) {
            return false;
        }

        return $this->hasGlobalUsesRemaining();
    }

    public function perCustomerUsageLimit(): int
    {
        return max(1, (int) ($this->per_customer_limit ?? 1));
    }

    public function customerUsageCount(int $customerId): int
    {
        return (int) $this->usages()->where('customer_id', $customerId)->count();
    }

    public function hasGlobalUsesRemaining(): bool
    {
        return $this->usage_limit === null || $this->used_count < $this->usage_limit;
    }

    public function hasCustomerUsesRemaining(int $customerId): bool
    {
        return $this->customerUsageCount($customerId) < $this->perCustomerUsageLimit();
    }

    public function redemptionBlockReason(?int $customerId = null, ?float $subtotal = null, ?int $marketId = null): ?string
    {
        if (! $this->is_active) {
            return 'This voucher is no longer active.';
        }

        if ($marketId !== null && ! $this->appliesToMarket($marketId)) {
            return 'This voucher is not valid for the selected market.';
        }

        $now = now();
        if ($this->starts_at && $now->lt($this->starts_at)) {
            return 'This voucher is not active yet.';
        }

        if ($this->expires_at && $now->gt($this->expires_at)) {
            return 'This voucher has expired.';
        }

        if (! $this->hasGlobalUsesRemaining()) {
            return 'This voucher has reached its total usage limit.';
        }

        if ($customerId && ! $this->hasCustomerUsesRemaining($customerId)) {
            return 'You have reached the usage limit for this voucher.';
        }

        if ($subtotal !== null && $this->min_order_amount && $subtotal < $this->min_order_amount) {
            return 'Minimum order of PHP '.number_format($this->min_order_amount, 2).' is required for this voucher.';
        }

        return null;
    }

    public function calculateTotalDiscount(float $subtotal, float $serviceFee, float $deliveryFee): float
    {
        $targets = $this->applies_to ?? ['subtotal'];
        $totalDiscount = 0.0;

        foreach ($targets as $target) {
            $base = match ($target) {
                'service_fee' => $serviceFee,
                'delivery_fee' => $deliveryFee,
                default => $subtotal,
            };
            $totalDiscount += $this->calculateDiscount($base);
        }

        return round($totalDiscount, 2);
    }

    public function calculateDiscount(float $baseAmount): float
    {
        if ($this->discount_type === 'percentage') {
            $discount = $baseAmount * ($this->discount_value / 100);
            if ($this->max_discount_amount) {
                $discount = min($discount, $this->max_discount_amount);
            }
        } else {
            $discount = $this->discount_value;
        }

        return min($discount, $baseAmount);
    }

    public function getAppliesToLabelAttribute(): string
    {
        $targets = $this->applies_to ?? ['subtotal'];

        return implode(', ', array_map(fn ($t) => self::TARGETS[$t] ?? $t, $targets));
    }

    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_active', true);
    }

    public function scopeCurrentlyRedeemable(Builder $query): Builder
    {
        return $query->where('is_active', true)
            ->where(fn (Builder $q) => $q->whereNull('starts_at')->orWhere('starts_at', '<=', now()))
            ->where(fn (Builder $q) => $q->whereNull('expires_at')->orWhere('expires_at', '>=', now()))
            ->where(fn (Builder $q) => $q->whereNull('usage_limit')->orWhereColumn('used_count', '<', 'usage_limit'));
    }

    public function scopeAvailableForCustomer(Builder $query, int $customerId, ?int $marketId = null): Builder
    {
        $customerUsageCounts = VoucherUsage::query()
            ->select('voucher_id', DB::raw('COUNT(*) as customer_used_count'))
            ->where('customer_id', $customerId)
            ->groupBy('voucher_id');

        return $query->currentlyRedeemable()
            ->where('is_public', true)
            ->when($marketId !== null, fn (Builder $q) => $q->where(
                fn (Builder $q) => $q->whereNull('market_id')->orWhere('market_id', $marketId)
            ))
            ->leftJoinSub($customerUsageCounts, 'customer_voucher_usage_counts', function ($join) {
                $join->on('vouchers.id', '=', 'customer_voucher_usage_counts.voucher_id');
            })
            ->whereRaw('COALESCE(customer_voucher_usage_counts.customer_used_count, 0) < COALESCE(vouchers.per_customer_limit, 1)')
            ->select('vouchers.*');
    }
}
