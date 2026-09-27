<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;

class CuratedProduct extends Model
{
    public const SECTIONS = [
        'highlighted_products' => 'Highlighted Products',
        'best_deals' => "Today's Best Deals",
    ];

    protected $fillable = [
        'section',
        'item_id',
        'sort_order',
        'is_active',
        'created_by',
    ];

    protected function casts(): array
    {
        return [
            'sort_order' => 'integer',
            'is_active' => 'boolean',
        ];
    }

    public function item()
    {
        return $this->belongsTo(Item::class);
    }

    public function createdBy()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function scopeActiveForSection(Builder $query, string $section): Builder
    {
        return $query
            ->where('section', $section)
            ->where('is_active', true)
            ->orderBy('sort_order')
            ->orderBy('id');
    }
}
