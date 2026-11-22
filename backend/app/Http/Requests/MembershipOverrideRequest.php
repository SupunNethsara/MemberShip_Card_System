<?php

namespace App\Http\Requests;

use Illuminate\Validation\Rule;

class MembershipOverrideRequest extends ApiRequest
{
    public function rules(): array
    {
        return [
            'status' => ['required', Rule::in(['active', 'cancelled'])],
            'membership_tier_id' => ['required_if:status,active', 'nullable', 'integer', 'exists:membership_tiers,id'],
            'starts_at' => ['nullable', 'date'],
            'expires_at' => ['nullable', 'date', 'after:starts_at'],
            'notes' => ['required', 'string', 'max:255'],
            'notify' => ['nullable', 'boolean'],
        ];
    }

    public function messages(): array
    {
        return ['notes.required' => 'A reason is required for the audit log.'];
    }
}
