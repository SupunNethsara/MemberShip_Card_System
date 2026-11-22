<?php

namespace App\Http\Requests;

use Illuminate\Validation\Rule;

class OfferRequest extends ApiRequest
{
    public function rules(): array
    {
        return [
            'partner_id' => ['required', 'integer', 'exists:partners,id'],
            ...$this->translatable('title', true, 160),
            ...$this->translatable('description', false, 2000),
            ...$this->translatable('terms', false, 2000),
            'discount_type' => ['required', Rule::in(['percentage', 'fixed', 'freebie'])],
            'discount_value' => ['nullable', 'required_unless:discount_type,freebie', 'numeric', 'min:0',
                Rule::when($this->input('discount_type') === 'percentage', ['max:100'])],
            'starts_at' => ['nullable', 'date'],
            'ends_at' => ['nullable', 'date', 'after_or_equal:starts_at'],
            'is_active' => ['boolean'],
            'tier_ids' => ['required', 'array', 'min:1'],
            'tier_ids.*' => ['integer', 'exists:membership_tiers,id'],
        ];
    }

    public function messages(): array
    {
        return ['tier_ids.required' => 'Select at least one membership tier that unlocks this offer.'];
    }
}
