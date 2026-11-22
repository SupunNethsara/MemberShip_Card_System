<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\Invoice */
class InvoiceResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'number' => $this->number,
            'type' => $this->type,
            'amount' => (float) $this->amount,
            'currency' => $this->currency,
            'status' => $this->status,
            'notes' => $this->notes,
            'slip_url' => $this->slipUrl(),
            'paid_at' => $this->paid_at?->toIso8601String(),
            'created_at' => $this->created_at?->toIso8601String(),
            'user' => $this->whenLoaded('user', fn () => $this->user?->only(['id', 'name', 'email', 'phone', 'member_code'])),
            'tier' => $this->whenLoaded('tier', fn () => $this->tier ? ['id' => $this->tier->id, 'name' => $this->tier->name, 'color' => $this->tier->color] : null),
            'gateway' => $this->whenLoaded('gateway', fn () => $this->gateway ? ['id' => $this->gateway->id, 'name' => $this->gateway->name, 'driver' => $this->gateway->driver] : null),
            'membership' => new MembershipResource($this->whenLoaded('membership')),
            'transactions' => PaymentTransactionResource::collection($this->whenLoaded('transactions')),
        ];
    }
}
