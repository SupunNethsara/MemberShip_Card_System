<?php

namespace App\Http\Resources;

use App\Support\PermissionRegistry;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\User */
class UserResource extends JsonResource
{
    /** Include role & effective permission names (for the authenticated user payload). */
    public bool $withAccess = false;

    public function withAccess(): static
    {
        $this->withAccess = true;

        return $this;
    }

    public function toArray(Request $request): array
    {
        $membership = $this->relationLoaded('activeMembership') ? $this->activeMembership : null;

        return [
            'id' => $this->id,
            'name' => $this->name,
            'email' => $this->email,
            'phone' => $this->phone,
            'phone_verified_at' => $this->phone_verified_at?->toIso8601String(),
            'nic' => $this->nic,
            'member_code' => $this->member_code,
            'preferred_locale' => $this->preferred_locale,
            'status' => $this->status,
            'suspension_reason' => $this->suspension_reason,
            'is_staff' => $this->is_staff,
            'roles' => $this->whenLoaded('roles', fn () => $this->roles->pluck('name')),
            'permissions' => $this->when($this->withAccess, fn () => $this->isSuperAdmin()
                ? PermissionRegistry::all()
                : $this->getAllPermissions()->pluck('name')->values()),
            'active_membership' => $this->when($this->relationLoaded('activeMembership'), fn () => $membership ? new MembershipResource($membership) : null),
            'memberships' => MembershipResource::collection($this->whenLoaded('memberships')),
            'last_login_at' => $this->last_login_at?->toIso8601String(),
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
