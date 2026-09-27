<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Order extends Model
{
    protected $fillable = [
        'order_number',
        'invoice_series_number',
        'invoice_pdf_path',
        'customer_id',
        'market_id',

        'subtotal',
        'service_fee',
        'delivery_fee',
        'vat',
        'voucher_discount',
        'voucher_code',
        'voucher_id',
        'total_amount',
        'distance_meters',

        'order_type',
        'paluto_stall_id',
        'paluto_cooking_fee',

        'payment_method',
        'payment_status',
        'payment_reference',
        'cashless_payment_id',

        'contact_name',
        'contact_phone',
        'delivery_address',
        'latitude',
        'longitude',

        'status',

        'rider_id',
        'assigned_at',
        'accepted_at',
        'prepared_at',
        'out_for_delivery_at',
        'completed_at',
        'cancelled_at',
        'cancellation_reason',

        'delivery_photo',

        'is_reservation',
        'scheduled_delivery_time',
        'delivery_slot',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'is_reservation' => 'boolean',
            'scheduled_delivery_time' => 'datetime',
            'assigned_at' => 'datetime',
            'accepted_at' => 'datetime',
            'prepared_at' => 'datetime',
            'out_for_delivery_at' => 'datetime',
            'completed_at' => 'datetime',
            'cancelled_at' => 'datetime',
        ];
    }

    public function items()
    {
        return $this->hasMany(OrderItem::class);
    }

    public function recipeBundles()
    {
        return $this->hasMany(OrderRecipeBundle::class);
    }

    public function palutoStall()
    {
        return $this->belongsTo(PalutoStall::class, 'paluto_stall_id');
    }

    public function customer()
    {
        return $this->belongsTo(Customer::class);
    }

    public function market()
    {
        return $this->belongsTo(Market::class);
    }

    public function rider()
    {
        return $this->belongsTo(Rider::class);
    }

    public function voucher()
    {
        return $this->belongsTo(Voucher::class);
    }

    public function cashlessPayment()
    {
        return $this->hasOne(CashlessPayment::class);
    }

    public function supportThread()
    {
        return $this->hasOne(SupportThread::class);
    }

    public function feedback()
    {
        return $this->hasOne(OrderFeedback::class);
    }

    /**
     * Cancellable while newly placed, or while still awaiting a redirect-based
     * cashless payment (BPI online banking, QR Ph) the customer wants to abandon.
     */
    public function isCustomerCancellable(): bool
    {
        if (in_array($this->status, ['order_received', 'pending'], true)) {
            return true;
        }

        return $this->status === 'pending_payment'
            && in_array($this->payment_method, ['bpi', 'qrph'], true);
    }
}
