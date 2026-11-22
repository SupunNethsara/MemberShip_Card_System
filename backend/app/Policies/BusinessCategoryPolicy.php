<?php

namespace App\Policies;

use App\Models\User;
use App\Models\BusinessCategory;

class BusinessCategoryPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->can('partners.view');
    }

    public function view(User $user, $model): bool
    {
        return $user->can('partners.view');
    }

    public function create(User $user): bool
    {
        return $user->can('partners.manage');
    }

    public function update(User $user, $model): bool
    {
        return $user->can('partners.manage');
    }

    public function delete(User $user, $model): bool
    {
        return $user->can('partners.manage');
    }
}
