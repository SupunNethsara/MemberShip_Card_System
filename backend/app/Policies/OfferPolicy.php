<?php

namespace App\Policies;

use App\Models\User;
use App\Models\Offer;

class OfferPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->can('offers.view');
    }

    public function view(User $user, $model): bool
    {
        return $user->can('offers.view');
    }

    public function create(User $user): bool
    {
        return $user->can('offers.manage');
    }

    public function update(User $user, $model): bool
    {
        return $user->can('offers.manage');
    }

    public function delete(User $user, $model): bool
    {
        return $user->can('offers.manage');
    }
}
