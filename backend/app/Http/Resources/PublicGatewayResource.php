<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PublicGatewayResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'driver' => $this->driver,
            'name' => $this->display_name ?: ['en' => $this->name, 'si' => $this->name, 'ta' => $this->name],
            'is_default' => $this->is_default,
            'mode' => $this->mode,
        ];
    }
}
