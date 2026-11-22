<?php

namespace App\Models;

use App\Models\Concerns\HasTranslations;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage;

class HeroSlide extends Model
{
    use HasTranslations;

    public const TRANSLATABLE = ['badge', 'title', 'subtitle', 'cta_primary_label', 'cta_secondary_label'];

    protected array $translatable = self::TRANSLATABLE;

    protected $fillable = [
        'badge', 'title', 'subtitle', 'cta_primary_label', 'cta_primary_url', 'cta_secondary_label',
        'cta_secondary_url', 'background_path', 'sort_order', 'is_active',
    ];

    protected function casts(): array
    {
        return [
            'badge' => 'array', 'title' => 'array', 'subtitle' => 'array',
            'cta_primary_label' => 'array', 'cta_secondary_label' => 'array',
            'sort_order' => 'integer', 'is_active' => 'boolean',
        ];
    }

    public function scopeActive(Builder $q): Builder
    {
        return $q->where('is_active', true)->orderBy('sort_order')->orderBy('id');
    }

    public function backgroundUrl(): ?string
    {
        return $this->background_path ? Storage::disk('public')->url($this->background_path) : null;
    }
}
