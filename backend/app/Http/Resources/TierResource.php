<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\MembershipTier */
class TierResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'slug' => $this->slug,
            'name' => $this->name,
            'description' => $this->description,
            'features' => $this->features ?? [],
            'price' => (float) $this->price,
            'duration_value' => $this->duration_value,
            'duration_unit' => $this->duration_unit,
            'color' => $this->color,
            'priority' => $this->priority,
            'is_active' => $this->is_active,
            'is_featured' => $this->is_featured,
            'offers_count' => $this->whenCounted('offers'),
            'active_members_count' => $this->whenCounted('memberships'),
        ];
    }
}
