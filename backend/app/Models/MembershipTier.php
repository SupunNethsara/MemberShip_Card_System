<?php

namespace App\Models;

use App\Models\Concerns\HasTranslations;
use Carbon\CarbonInterface;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class MembershipTier extends Model
{
    use HasTranslations;

    protected array $translatable = ['name', 'description'];

    protected $fillable = [
        'slug', 'name', 'description', 'features', 'price', 'duration_value', 'duration_unit',
        'color', 'priority', 'is_active', 'is_featured',
    ];

    protected function casts(): array
    {
        return [
            'name' => 'array',
            'description' => 'array',
            'features' => 'array',
            'price' => 'decimal:2',
            'duration_value' => 'integer',
            'priority' => 'integer',
            'is_active' => 'boolean',
            'is_featured' => 'boolean',
        ];
    }

    public function offers(): BelongsToMany
    {
        return $this->belongsToMany(Offer::class);
    }

    public function memberships(): HasMany
    {
        return $this->hasMany(Membership::class);
    }

    public function scopeActive(Builder $q): Builder
    {
        return $q->where('is_active', true);
    }

    public function expiryFrom(CarbonInterface $start): CarbonInterface
    {
        return $this->duration_unit === 'days'
            ? $start->copy()->addDays($this->duration_value)
            : $start->copy()->addMonthsNoOverflow($this->duration_value);
    }
}
