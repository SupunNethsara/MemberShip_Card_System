<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\Offer */
class OfferResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'partner_id' => $this->partner_id,
            'partner' => $this->whenLoaded('partner', fn () => [
                'id' => $this->partner->id,
                'name' => $this->partner->name,
                'logo_url' => $this->partner->logoUrl(),
                'city' => $this->partner->city,
                'category' => $this->partner->relationLoaded('category') && $this->partner->category ? [
                    'id' => $this->partner->category->id,
                    'name' => $this->partner->category->name,
                    'icon' => $this->partner->category->icon,
                ] : null,
            ]),
            'title' => $this->title,
            'description' => $this->description,
            'terms' => $this->terms,
            'discount_type' => $this->discount_type,
            'discount_value' => $this->discount_value !== null ? (float) $this->discount_value : null,
            'starts_at' => $this->starts_at?->toDateString(),
            'ends_at' => $this->ends_at?->toDateString(),
            'is_active' => $this->is_active,
            'tier_ids' => $this->whenLoaded('tiers', fn () => $this->tiers->pluck('id')->values()),
            'tiers' => $this->whenLoaded('tiers', fn () => $this->tiers->map(fn ($t) => ['id' => $t->id, 'name' => $t->name, 'color' => $t->color, 'priority' => $t->priority])->values()),
            'is_unlocked' => $this->when(isset($this->is_unlocked), fn () => (bool) $this->is_unlocked),
        ];
    }
}
