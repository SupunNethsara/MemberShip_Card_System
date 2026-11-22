<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class MemberCard extends Model
{
    public const PENDING = 'pending';

    public const PRINTED = 'printed';

    public const ISSUED = 'issued';

    protected $fillable = [
        'user_id', 'card_status', 'pending_reason', 'card_printed_at', 'card_printed_by',
        'issued_at', 'issued_by', 'reprint_count',
    ];

    protected function casts(): array
    {
        return [
            'card_printed_at' => 'datetime',
            'issued_at' => 'datetime',
            'reprint_count' => 'integer',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function printedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'card_printed_by');
    }

    public function issuedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'issued_by');
    }

    public function logs(): HasMany
    {
        return $this->hasMany(MemberCardLog::class)->latest('created_at')->latest('id');
    }

    /** A card printed at least once before — the next print is a reprint. */
    public function hasBeenPrinted(): bool
    {
        return $this->card_printed_at !== null;
    }
}
