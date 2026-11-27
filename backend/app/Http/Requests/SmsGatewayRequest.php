<?php

namespace App\Http\Requests;

use App\Services\Sms\SmsGatewayFactory;
use Illuminate\Validation\Rule;

class SmsGatewayRequest extends ApiRequest
{
    public function rules(): array
    {
        $creating = $this->isMethod('post');
        $driver = $creating ? $this->input('driver') : ($this->route('smsGateway')?->driver ?? $this->route('sms_gateway')?->driver);

        return [
            'driver' => [$creating ? 'required' : 'prohibited', Rule::in(array_keys(SmsGatewayFactory::DRIVERS))],
            'name' => ['required', 'string', 'max:80'],
            'is_active' => ['boolean'],
            'is_primary' => ['boolean'],
            'is_fallback' => ['boolean'],
            'sender_id' => ['nullable', 'string', 'max:20'],
            'credentials' => ['nullable', 'array'],
            'credentials.*' => ['nullable', 'string', 'max:4000'],
            'settings' => ['nullable', 'array'],
            'settings.quota_capacity' => ['nullable', 'integer', 'min:0', 'max:10000000'],
            'settings.validity_months' => ['nullable', 'integer', 'min:1', 'max:120'],
            'settings.valid_from' => ['nullable', 'date'],
            'settings.valid_until' => ['nullable', 'date'],
            'settings.alert_threshold' => ['nullable', 'integer', 'min:0', 'max:100000'],
            'settings.cost_per_sms' => ['nullable', 'numeric', 'min:0', 'max:1000'],
            'settings.endpoint' => [$driver === 'custom_http' ? 'required' : 'nullable', 'string', 'max:500'],
            'settings.method' => ['nullable', Rule::in(['GET', 'POST', 'PUT'])],
            'settings.body_format' => ['nullable', Rule::in(['query', 'json', 'form'])],
            'settings.headers' => ['nullable', 'array'],
            'settings.headers.*.key' => ['nullable', 'string', 'max:120'],
            'settings.headers.*.value' => ['nullable', 'string', 'max:1000'],
            'settings.payload' => ['nullable', 'array'],
            'settings.payload.*.key' => ['nullable', 'string', 'max:120'],
            'settings.payload.*.value' => ['nullable', 'string', 'max:1000'],
        ];
    }
}
