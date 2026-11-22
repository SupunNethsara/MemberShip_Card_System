<?php

namespace App\Repositories;

use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;

class UserRepository extends BaseRepository
{
    protected array $searchable = ['name', 'email', 'phone', 'member_code', 'nic'];

    protected array $sortable = [
        'name' => 'name', 'email' => 'email', 'member_code' => 'member_code',
        'created_at' => 'created_at', 'last_login_at' => 'last_login_at',
    ];

    protected function model(): string
    {
        return User::class;
    }

    public function paginateMembers(array $params): LengthAwarePaginator
    {
        $this->with = ['activeMembership.tier', 'roles'];

        return $this->paginate($params, function (Builder $q) use ($params) {
            $q->where('is_staff', false);

            if (! empty($params['status'])) {
                match ($params['status']) {
                    'active' => $q->whereHas('memberships', fn ($m) => $m->where('status', 'active')->where('expires_at', '>', now())),
                    'expiring' => $q->whereHas('memberships', fn ($m) => $m->where('status', 'active')->whereBetween('expires_at', [now(), now()->addDays(30)])),
                    'expired' => $q->whereHas('memberships')->whereDoesntHave('memberships', fn ($m) => $m->where('status', 'active')->where('expires_at', '>', now())),
                    'no_plan' => $q->whereDoesntHave('memberships', fn ($m) => $m->whereIn('status', ['active', 'expired'])),
                    'suspended' => $q->where('status', 'suspended'),
                    default => null,
                };
            }

            if (! empty($params['tier_id'])) {
                $q->whereHas('memberships', fn ($m) => $m->where('membership_tier_id', $params['tier_id'])->where('status', 'active')->where('expires_at', '>', now()));
            }
        });
    }

    public function paginateStaff(array $params): LengthAwarePaginator
    {
        $this->with = ['roles'];

        return $this->paginate($params, function (Builder $q) use ($params) {
            $q->where('is_staff', true);
            if (! empty($params['role'])) {
                $q->role($params['role']);
            }
        });
    }
}
