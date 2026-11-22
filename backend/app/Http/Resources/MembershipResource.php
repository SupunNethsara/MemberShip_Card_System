<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\Membership */
class MembershipResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $active = $this->isCurrentlyActive();

        return [
            'id' => $this->id,
            'status' => $active ? 'active' : ($this->status === 'active' ? 'expired' : $this->status),
            'source' => $this->source,
            'starts_at' => $this->starts_at?->toIso8601String(),
            'expires_at' => $this->expires_at?->toIso8601String(),
            'days_remaining' => $active ? $this->daysRemaining() : 0,
            'notes' => $this->notes,
            'tier' => new TierResource($this->whenLoaded('tier')),
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
