<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class SmsLogResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'recipient' => $this->recipient,
            'event' => $this->event,
            'locale' => $this->locale,
            'message' => $this->message,
            'status' => $this->status,
            'http_status' => $this->http_status,
            'provider_response' => $this->provider_response,
            'segments' => $this->segments,
            'gateway' => $this->whenLoaded('gateway', fn () => $this->gateway?->only(['id', 'name', 'driver'])),
            'user' => $this->whenLoaded('user', fn () => $this->user?->only(['id', 'name', 'member_code'])),
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
