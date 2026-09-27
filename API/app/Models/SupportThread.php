<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SupportThread extends Model
{
    protected $fillable = ['customer_id', 'market_id', 'order_id', 'subject', 'status', 'last_message_at'];

    protected function casts(): array
    {
        return ['last_message_at' => 'datetime'];
    }

    public function customer()
    {
        return $this->belongsTo(Customer::class);
    }

    public function market()
    {
        return $this->belongsTo(Market::class);
    }

    public function order()
    {
        return $this->belongsTo(Order::class);
    }

    public function messages()
    {
        return $this->hasMany(SupportMessage::class);
    }

    public function latestMessage()
    {
        return $this->hasOne(SupportMessage::class)->latestOfMany();
    }
}
