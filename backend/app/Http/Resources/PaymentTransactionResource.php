<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\PaymentTransaction */
class PaymentTransactionResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'driver' => $this->driver,
            'direction' => $this->direction,
            'reference' => $this->reference,
            'status' => $this->status,
            'amount' => $this->amount !== null ? (float) $this->amount : null,
            'message' => $this->message,
            'payload' => $this->when($request->user()?->can('payments.view'), $this->payload),
            'ip_address' => $this->ip_address,
            'invoice' => $this->whenLoaded('invoice', fn () => [
                'id' => $this->invoice->id,
                'number' => $this->invoice->number,
                'member' => $this->invoice->relationLoaded('user') ? $this->invoice->user?->name : null,
            ]),
            'gateway' => $this->whenLoaded('gateway', fn () => $this->gateway?->only(['id', 'name', 'driver'])),
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
