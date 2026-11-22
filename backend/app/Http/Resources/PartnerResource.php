<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\Partner */
class PartnerResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'slug' => $this->slug,
            'name' => $this->name,
            'description' => $this->description,
            'logo_url' => $this->logoUrl(),
            'business_category_id' => $this->business_category_id,
            'category' => new CategoryResource($this->whenLoaded('category')),
            'contact_person' => $this->contact_person,
            'phone' => $this->phone,
            'email' => $this->email,
            'website' => $this->website,
            'address' => $this->address,
            'city' => $this->city,
            'google_maps_url' => $this->google_maps_url,
            'is_active' => $this->is_active,
            'is_featured' => $this->is_featured,
            'branches' => $this->whenLoaded('branches', fn () => $this->branches->map->only(['id', 'name', 'address', 'city', 'phone', 'google_maps_url'])),
            'offers' => OfferResource::collection($this->whenLoaded('offers')),
            'offers_count' => $this->whenCounted('offers'),
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
