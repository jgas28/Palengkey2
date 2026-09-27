<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DeletedAccountCooldown extends Model
{
    public const COOLDOWN_DAYS = 120;

    protected $fillable = [
        'email',
        'phone',
        'deleted_at',
        'expires_at',
    ];

    protected $casts = [
        'deleted_at' => 'datetime',
        'expires_at' => 'datetime',
    ];

    public static function blocking(string $email, ?string $phone = null): ?self
    {
        return static::where('expires_at', '>', now())
            ->where(function ($query) use ($email, $phone) {
                $query->where('email', strtolower($email));

                if ($phone) {
                    $query->orWhere('phone', $phone);
                }
            })
            ->orderByDesc('expires_at')
            ->first();
    }
}
