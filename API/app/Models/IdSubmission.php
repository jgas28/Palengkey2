<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class IdSubmission extends Model
{
    protected $fillable = [
        'customer_id',
        'order_id',
        'id_type',
        'id_number',
        'full_name',
        'date_of_birth',
        'id_document_path',
        'selfie_path',
        'status',
        'reviewed_by',
        'reviewed_at',
        'review_notes',
    ];

    protected function casts(): array
    {
        return [
            'date_of_birth' => 'date',
            'reviewed_at' => 'datetime',
        ];
    }

    public function customer()
    {
        return $this->belongsTo(Customer::class);
    }

    public function order()
    {
        return $this->belongsTo(Order::class);
    }

    public function reviewedByUser()
    {
        return $this->belongsTo(User::class, 'reviewed_by');
    }
}
