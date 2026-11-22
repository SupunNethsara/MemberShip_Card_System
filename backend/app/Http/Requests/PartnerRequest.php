<?php

namespace App\Http\Requests;

class PartnerRequest extends ApiRequest
{
    protected function prepareForValidation(): void
    {
        // Multipart forms send booleans as "1"/"0" and empty arrays as [""].
        $branches = collect($this->input('branches', []))->filter(fn ($b) => is_array($b))->values()->all();
        $this->merge(['branches' => $branches]);
    }

    public function rules(): array
    {
        return [
            ...$this->translatable('name', true, 120),
            ...$this->translatable('description', false, 2000),
            'business_category_id' => ['nullable', 'integer', 'exists:business_categories,id'],
            'logo' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:2048'],
            'remove_logo' => ['nullable', 'boolean'],
            'contact_person' => ['nullable', 'string', 'max:120'],
            'phone' => ['nullable', 'string', 'max:32'],
            'email' => ['nullable', 'email', 'max:190'],
            'website' => ['nullable', 'url', 'max:255'],
            'address' => ['nullable', 'string', 'max:255'],
            'city' => ['nullable', 'string', 'max:80'],
            'google_maps_url' => ['nullable', 'url', 'max:500'],
            'is_active' => ['nullable', 'boolean'],
            'is_featured' => ['nullable', 'boolean'],
            'branches' => ['nullable', 'array', 'max:50'],
            'branches.*.id' => ['nullable', 'integer'],
            'branches.*.name' => ['required', 'string', 'max:120'],
            'branches.*.address' => ['nullable', 'string', 'max:255'],
            'branches.*.city' => ['nullable', 'string', 'max:80'],
            'branches.*.phone' => ['nullable', 'string', 'max:32'],
            'branches.*.google_maps_url' => ['nullable', 'url', 'max:500'],
        ];
    }
}
