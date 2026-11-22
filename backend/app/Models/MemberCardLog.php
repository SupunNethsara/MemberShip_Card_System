<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MemberCardLog extends Model
{
    public const UPDATED_AT = null;

    protected $fillable = ['member_card_id', 'user_id', 'action', 'performed_by', 'batch_ref', 'snapshot', 'note'];

    protected function casts(): array
    {
        return ['snapshot' => 'array', 'created_at' => 'datetime'];
    }

    public function card(): BelongsTo
    {
        return $this->belongsTo(MemberCard::class, 'member_card_id');
    }

    public function performer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'performed_by');
    }
}
