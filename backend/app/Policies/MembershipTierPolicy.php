<?php

namespace App\Policies;

use App\Models\User;
use App\Models\MembershipTier;

class MembershipTierPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->can('tiers.view');
    }

    public function view(User $user, $model): bool
    {
        return $user->can('tiers.view');
    }

    public function create(User $user): bool
    {
        return $user->can('tiers.manage');
    }

    public function update(User $user, $model): bool
    {
        return $user->can('tiers.manage');
    }

    public function delete(User $user, $model): bool
    {
        return $user->can('tiers.manage');
    }
}
