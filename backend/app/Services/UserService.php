<?php

namespace App\Services;

use App\Models\User;
use App\Notifications\PortalNotification;
use App\Services\Sms\SmsService;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Notification;
use Illuminate\Validation\ValidationException;
use Throwable;

class UserService
{
    public function __construct(
        private readonly MembershipService $memberships,
        private readonly SmsService $sms,
        private readonly AuditLogger $audit,
    ) {}

    public function registerMember(array $data, bool $sendWelcome = true): User
    {
        $user = DB::transaction(function () use ($data) {
            $user = User::query()->create([
                'name' => $data['name'],
                'email' => strtolower($data['email']),
                'phone' => $data['phone'] ?? null,
                'nic' => $data['nic'] ?? null,
                'password' => $data['password'],
                'preferred_locale' => $data['preferred_locale'] ?? 'en',
                'is_staff' => false,
                'phone_verified_at' => $data['phone_verified_at'] ?? now(),
            ]);
            $user->assignRole('Member');

            return $this->memberships->ensureMemberIdentity($user);
        });

        if ($sendWelcome) {
            $this->sms->sendEvent('registration_welcome', $user);
        }

        $staff = User::query()->where('is_staff', true)->get();
        PortalNotification::dispatchTo(
            $staff,
            'New Member Registered',
            "{$user->name} ({$user->phone}) has registered.",
            'info',
            '/admin/members',
            'user-plus'
        );

        return $user;
    }

    public function updateMember(User $user, array $data): User
    {
        $payload = collect($data)->only(['name', 'email', 'phone', 'nic', 'preferred_locale', 'status', 'suspension_reason'])->all();
        if (isset($data['status']) && $data['status'] === 'active') {
            $payload['suspension_reason'] = null;
        }
        if (! empty($data['password'])) {
            $payload['password'] = $data['password'];
        }
        $user->fill($payload);
        $dirty = array_keys($user->getDirty());
        $user->save();

        if (in_array('status', $dirty, true)) {
            $reasonDesc = ($user->status === 'suspended' && $user->suspension_reason)
                ? " (Reason: {$user->suspension_reason})"
                : '';
            $this->audit->log('member.status', "Set {$user->name} status to {$user->status}{$reasonDesc}", $user, [
                'status' => $user->status,
                'reason' => $user->suspension_reason,
            ]);
            if ($user->status === 'suspended') {
                $user->tokens()->delete();
            }
        }

        return $user;
    }

    public function saveStaff(?User $user, array $data): User
    {
        return DB::transaction(function () use ($user, $data) {
            $creating = ! $user;
            $user ??= new User(['is_staff' => true]);

            $payload = collect($data)->only(['name', 'email', 'phone', 'status', 'suspension_reason'])->all();
            if (isset($data['status']) && $data['status'] === 'active') {
                $payload['suspension_reason'] = null;
            }
            $user->fill($payload);
            $user->is_staff = true;
            if (! empty($data['password'])) {
                $user->password = $data['password'];
            }
            $dirty = array_keys($user->getDirty());
            $user->save();

            if (in_array('status', $dirty, true) && $user->status === 'suspended') {
                $user->tokens()->delete();
            }

            if (isset($data['roles'])) {
                if (in_array('Member', $data['roles'], true)) {
                    throw ValidationException::withMessages(['roles' => 'Staff accounts cannot hold the Member role.']);
                }
                $before = $user->getRoleNames()->all();
                $user->syncRoles($data['roles']);
                if ($before !== $data['roles']) {
                    $this->audit->log('staff.roles', "Assigned roles [".implode(', ', $data['roles'])."] to {$user->name}", $user, ['before' => $before, 'after' => $data['roles']]);
                }
            }

            if ($creating) {
                $this->audit->log('staff.created', "Created staff account {$user->name}", $user);
            }

            return $user->load('roles');
        });
    }

    public function delete(User $user, User $actor): void
    {
        if ($user->is($actor)) {
            throw ValidationException::withMessages(['user' => 'You cannot delete your own account.']);
        }
        if ($user->isSuperAdmin() && User::role('Super Admin')->count() <= 1) {
            throw ValidationException::withMessages(['user' => 'At least one Super Admin must remain.']);
        }
        $this->audit->log($user->is_staff ? 'staff.deleted' : 'member.deleted', "Deleted {$user->name} ({$user->email})", $user);
        $user->tokens()->delete();
        $user->delete();
    }
}
