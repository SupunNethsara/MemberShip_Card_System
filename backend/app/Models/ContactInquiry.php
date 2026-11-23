<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ContactInquiry extends Model
{
    public const STATUSES = ['new', 'in_progress', 'resolved', 'spam'];

    /** Topic keys sent by the public contact form. */
    public const SUBJECTS = [
        'membership' => 'Membership Registration & Tiers',
        'partner' => 'Partner Merchant Discounts',
        'billing' => 'Payment Gateway & Invoices',
        'merchant_join' => 'Become a Merchant Partner',
        'general' => 'General Support',
    ];

    protected $fillable = [
        'name', 'email', 'phone', 'subject', 'message', 'status', 'staff_note',
        'handled_by', 'handled_at', 'ip_address', 'user_agent',
    ];

    protected function casts(): array
    {
        return ['handled_at' => 'datetime'];
    }

    public function handler(): BelongsTo
    {
        return $this->belongsTo(User::class, 'handled_by');
    }
}
