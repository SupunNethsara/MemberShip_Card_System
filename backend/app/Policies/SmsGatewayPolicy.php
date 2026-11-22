<?php

namespace App\Policies;

use App\Models\User;
use App\Models\SmsGateway;

class SmsGatewayPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->can('gateways.sms.view');
    }

    public function view(User $user, $model): bool
    {
        return $user->can('gateways.sms.view');
    }

    public function create(User $user): bool
    {
        return $user->can('gateways.sms.manage');
    }

    public function update(User $user, $model): bool
    {
        return $user->can('gateways.sms.manage');
    }

    public function delete(User $user, $model): bool
    {
        return $user->can('gateways.sms.manage');
    }
}
