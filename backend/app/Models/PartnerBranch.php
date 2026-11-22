<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PartnerBranch extends Model
{
    protected $fillable = ['partner_id', 'name', 'address', 'city', 'phone', 'google_maps_url'];

    public function partner(): BelongsTo
    {
        return $this->belongsTo(Partner::class);
    }
}
