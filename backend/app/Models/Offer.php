<?php

namespace App\Models;

use App\Models\Concerns\HasTranslations;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Offer extends Model
{
    use HasTranslations;

    protected array $translatable = ['title', 'description', 'terms'];

    protected $fillable = [
        'partner_id', 'title', 'description', 'terms', 'discount_type', 'discount_value',
        'starts_at', 'ends_at', 'is_active',
    ];

    protected function casts(): array
    {
        return [
            'title' => 'array',
            'description' => 'array',
            'terms' => 'array',
            'discount_value' => 'decimal:2',
            'starts_at' => 'date',
            'ends_at' => 'date',
            'is_active' => 'boolean',
        ];
    }

    public function partner(): BelongsTo
    {
        return $this->belongsTo(Partner::class);
    }

    public function tiers(): BelongsToMany
    {
        return $this->belongsToMany(MembershipTier::class);
    }

    /** Active, within its validity window, and owned by an active partner. */
    public function scopeAvailable(Builder $q): Builder
    {
        $today = now()->toDateString();

        return $q->where('is_active', true)
            ->where(fn ($w) => $w->whereNull('starts_at')->orWhere('starts_at', '<=', $today))
            ->where(fn ($w) => $w->whereNull('ends_at')->orWhere('ends_at', '>=', $today))
            ->whereHas('partner', fn ($p) => $p->where('is_active', true));
    }
}
