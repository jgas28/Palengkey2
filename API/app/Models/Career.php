<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Career extends Model
{
    protected $fillable = [
        'title',
        'description',
        'responsibilities',
        'requirements',
        'location',
        'job_type',
        'salary_range',
        'status',
        'expires_at',
        'is_active',
        'created_by',
    ];

    protected function casts(): array
    {
        return [
            'expires_at' => 'datetime',
            'is_active' => 'boolean',
        ];
    }

    public function createdBy()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function isOpen(): bool
    {
        return $this->is_active
            && $this->status === 'open'
            && (! $this->expires_at || $this->expires_at->isFuture());
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true)
            ->where('status', 'open')
            ->where(fn ($q) => $q->whereNull('expires_at')->orWhere('expires_at', '>', now()));
    }
}
