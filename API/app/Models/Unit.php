<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Unit extends Model
{
    protected $fillable = ['name', 'short_name', 'status'];

    protected function casts(): array
    {
        return ['status' => 'boolean'];
    }

    public function items()
    {
        return $this->hasMany(Item::class);
    }

    public function scopeActive($query)
    {
        return $query->where('status', 1);
    }

    public function activeItems()
    {
        return $this->items()->where('status', 1);
    }

    public function canDeactivate(): bool
    {
        return ! $this->activeItems()->exists();
    }

    public function deactivate(): bool
    {
        return $this->canDeactivate() && $this->update(['status' => 0]);
    }

    public function restore(): bool
    {
        return $this->update(['status' => 1]);
    }
}
