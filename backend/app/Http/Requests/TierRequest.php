<?php

namespace App\Http\Requests;

use Illuminate\Validation\Rule;

class TierRequest extends ApiRequest
{
    public function rules(): array
    {
        $id = $this->route('tier')?->id;

        return [
            ...$this->translatable('name', true, 80),
            ...$this->translatable('description', false, 1000),
            'slug' => ['nullable', 'alpha_dash', 'max:64', Rule::unique('membership_tiers', 'slug')->ignore($id)],
            'features' => ['nullable', 'array', 'max:20'],
            'features.*.en' => ['nullable', 'string', 'max:160'],
            'features.*.si' => ['nullable', 'string', 'max:160'],
            'features.*.ta' => ['nullable', 'string', 'max:160'],
            'price' => ['required', 'numeric', 'min:0', 'max:9999999'],
            'duration_value' => ['required', 'integer', 'min:1', 'max:3650'],
            'duration_unit' => ['required', Rule::in(['days', 'months'])],
            'color' => ['required', 'regex:/^#[0-9a-fA-F]{6}$/'],
            'priority' => ['nullable', 'integer', 'min:0', 'max:1000'],
            'is_active' => ['boolean'],
            'is_featured' => ['boolean'],
        ];
    }
}
