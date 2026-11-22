<?php

namespace App\Http\Requests;

class CheckoutRequest extends ApiRequest
{
    public function rules(): array
    {
        return [
            'tier_id' => ['required', 'integer', 'exists:membership_tiers,id'],
            'gateway_id' => ['nullable', 'integer', 'exists:payment_gateways,id'],
        ];
    }
}
