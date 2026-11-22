<?php

namespace App\Policies;

use App\Models\User;
use App\Models\Faq;

class FaqPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->can('cms.view');
    }

    public function view(User $user, $model): bool
    {
        return $user->can('cms.view');
    }

    public function create(User $user): bool
    {
        return $user->can('cms.manage');
    }

    public function update(User $user, $model): bool
    {
        return $user->can('cms.manage');
    }

    public function delete(User $user, $model): bool
    {
        return $user->can('cms.manage');
    }
}
