<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Membership extends Model
{
    protected $fillable = [
        'user_id', 'membership_tier_id', 'status', 'source', 'starts_at', 'expires_at', 'reminder_sent_at', 'notes',
    ];

    protected function casts(): array
    {
        return [
            'starts_at' => 'datetime',
            'expires_at' => 'datetime',
            'reminder_sent_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function tier(): BelongsTo
    {
        return $this->belongsTo(MembershipTier::class, 'membership_tier_id');
    }

    public function isCurrentlyActive(): bool
    {
        return $this->status === 'active' && $this->expires_at?->isFuture();
    }

    public function daysRemaining(): int
    {
        return $this->expires_at ? max(0, (int) ceil(now()->diffInDays($this->expires_at, false))) : 0;
    }
}
