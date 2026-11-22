<?php

namespace App\Policies;

use App\Models\User;

/** Members and staff are both Users; the required permission depends on which kind is targeted. */
class UserPolicy
{
    private function prefix(User $target): string
    {
        return $target->is_staff ? 'staff' : 'members';
    }

    public function viewAny(User $user): bool
    {
        return $user->can('members.view') || $user->can('staff.view');
    }

    public function view(User $user, User $target): bool
    {
        return $user->is($target) || $user->can($this->prefix($target).'.view');
    }

    public function create(User $user): bool
    {
        return $user->can('members.create') || $user->can('staff.manage');
    }

    public function update(User $user, User $target): bool
    {
        if ($target->is_staff) {
            // Only a Super Admin may edit another Super Admin.
            return $user->can('staff.manage') && (! $target->isSuperAdmin() || $user->isSuperAdmin());
        }

        return $user->can('members.update');
    }

    public function delete(User $user, User $target): bool
    {
        if ($target->is_staff) {
            return $user->can('staff.manage') && (! $target->isSuperAdmin() || $user->isSuperAdmin());
        }

        return $user->can('members.delete');
    }

    public function override(User $user, User $target): bool
    {
        return ! $target->is_staff && $user->can('members.override');
    }
}
