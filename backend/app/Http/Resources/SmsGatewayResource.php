<?php

namespace App\Http\Resources;

use App\Services\Sms\SmsGatewayFactory;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\SmsGateway — admin view, credentials masked */
class SmsGatewayResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $class = SmsGatewayFactory::DRIVERS[$this->driver] ?? null;

        return [
            'id' => $this->id,
            'driver' => $this->driver,
            'driver_label' => $class ? $class::definition()['label'] : $this->driver,
            'name' => $this->name,
            'is_active' => $this->is_active,
            'is_primary' => $this->is_primary,
            'is_fallback' => $this->is_fallback,
            'sender_id' => $this->sender_id,
            'settings' => (object) ($this->settings ?? []),
            'credentials' => (object) $this->maskedCredentials(),
            'configured_keys' => array_keys(array_filter($this->credentials(), fn ($v) => $v !== '' && $v !== null)),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
