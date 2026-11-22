<?php

namespace App\Http\Requests;

use App\Services\Payments\PaymentGatewayFactory;
use Illuminate\Validation\Rule;

class PaymentGatewayRequest extends ApiRequest
{
    public function rules(): array
    {
        $creating = $this->isMethod('post');

        return [
            'driver' => [$creating ? 'required' : 'prohibited', Rule::in(array_keys(PaymentGatewayFactory::DRIVERS))],
            'name' => ['required', 'string', 'max:80'],
            ...$this->translatable('display_name', false, 80),
            'mode' => ['required', Rule::in(['sandbox', 'live'])],
            'is_active' => ['boolean'],
            'is_default' => ['boolean'],
            'sort_order' => ['nullable', 'integer', 'min:0', 'max:999'],
            'credentials' => ['nullable', 'array'],
            'credentials.*' => ['nullable', 'string', 'max:8000'],
            'settings' => ['nullable', 'array'],
        ];
    }
}
