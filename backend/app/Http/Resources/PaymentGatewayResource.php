<?php

namespace App\Http\Resources;

use App\Services\Payments\PaymentGatewayFactory;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\PaymentGateway — admin view, credentials masked */
class PaymentGatewayResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $class = PaymentGatewayFactory::DRIVERS[$this->driver] ?? null;
        $definition = $class ? $class::definition() : null;

        return [
            'id' => $this->id,
            'driver' => $this->driver,
            'driver_label' => $definition['label'] ?? $this->driver,
            'name' => $this->name,
            'display_name' => $this->display_name,
            'mode' => $this->mode,
            'is_active' => $this->is_active,
            'is_default' => $this->is_default,
            'sort_order' => $this->sort_order,
            'settings' => (object) ($this->settings ?? []),
            'credentials' => (object) $this->maskedCredentials(),
            'configured_keys' => array_keys(array_filter($this->credentials(), fn ($v) => $v !== '' && $v !== null)),
            'webhook_url' => ($definition['supports_webhook'] ?? false) ? $this->webhookUrl() : null,
            'return_url' => $this->driver === 'webxpay' ? $this->returnUrl() : null,
            'transactions_count' => $this->whenCounted('transactions'),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
