<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Order extends Model
{
    /**
     * Paid on a PayMongo-hosted checkout page — key is our payment_method value,
     * value is the PayMongo checkout `payment_method_types` entry.
     */
    public const CHECKOUT_SESSION_METHODS = [
        'card' => 'card',
        'gcash' => 'gcash',
        'maya' => 'paymaya',
        'ubp' => 'dob_ubp',
    ];

    /** Every method that's paid online before the order is confirmed. */
    public const CASHLESS_METHODS = ['qrph', 'bpi', 'card', 'gcash', 'maya', 'ubp'];

    public const PAYMENT_METHOD_LABELS = [
        'cod' => 'Cash on Delivery',
        'qrph' => 'QR Ph',
        'bpi' => 'BPI',
        'card' => 'Visa / Mastercard',
        'gcash' => 'GCash',
        'maya' => 'Maya',
        'ubp' => 'UnionBank',
    ];

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
        'bulk_discount',
        'bulk_delivery_subsidy',
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

    public static function paymentMethodLabel(?string $method): string
    {
        return self::PAYMENT_METHOD_LABELS[strtolower((string) $method)] ?? strtoupper((string) $method);
    }

    /**
     * Cancellable while newly placed, or while still awaiting an online payment
     * (QR Ph, BPI, card, GCash, Maya, UnionBank) the customer wants to abandon.
     */
    public function isCustomerCancellable(): bool
    {
        if (in_array($this->status, ['order_received', 'pending'], true)) {
            return true;
        }

        return $this->status === 'pending_payment'
            && in_array($this->payment_method, self::CASHLESS_METHODS, true);
    }
}
