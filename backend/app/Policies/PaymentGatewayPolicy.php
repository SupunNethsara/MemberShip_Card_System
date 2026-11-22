<?php

namespace App\Policies;

use App\Models\User;
use App\Models\PaymentGateway;

class PaymentGatewayPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->can('gateways.payment.view');
    }

    public function view(User $user, $model): bool
    {
        return $user->can('gateways.payment.view');
    }

    public function create(User $user): bool
    {
        return $user->can('gateways.payment.manage');
    }

    public function update(User $user, $model): bool
    {
        return $user->can('gateways.payment.manage');
    }

    public function delete(User $user, $model): bool
    {
        return $user->can('gateways.payment.manage');
    }
}
