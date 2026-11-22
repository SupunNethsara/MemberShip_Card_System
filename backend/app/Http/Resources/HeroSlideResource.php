<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\HeroSlide */
class HeroSlideResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'badge' => $this->badge,
            'title' => $this->title,
            'subtitle' => $this->subtitle,
            'cta_primary_label' => $this->cta_primary_label,
            'cta_primary_url' => $this->cta_primary_url,
            'cta_secondary_label' => $this->cta_secondary_label,
            'cta_secondary_url' => $this->cta_secondary_url,
            'background_url' => $this->backgroundUrl(),
            'sort_order' => $this->sort_order,
            'is_active' => $this->is_active,
        ];
    }
}
