<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class HeroContent extends Model
{
    protected $table = 'hero_contents';

    protected $fillable = [
        'page_name',
        'title',
        'subtitle',
        'description',
        'image_url',
        'cta_text',
        'cta_link',
        'cta_text_2',
        'cta_link_2',
        'stats_json',
        'is_active',
        'created_by',
        'sequence',
    ];

    protected function casts(): array
    {
        return [
            'stats_json' => 'array',
            'is_active' => 'boolean',
            'sequence' => 'integer',
        ];
    }

    public function createdBy()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public static function byPage($pageName)
    {
        return self::where('page_name', $pageName)
            ->orderByDesc('is_active')
            ->orderByDesc('created_at')
            ->get();
    }
}
