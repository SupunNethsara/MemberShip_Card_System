<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class RoleResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'description' => $this->description,
            'is_system' => (bool) $this->is_system,
            'is_staff' => (bool) $this->is_staff,
            'permissions' => $this->whenLoaded('permissions', fn () => $this->name === 'Super Admin' ? \App\Support\PermissionRegistry::all() : $this->permissions->pluck('name')->values()),
            'users_count' => $this->when(isset($this->users_count), fn () => (int) $this->users_count),
        ];
    }
}
