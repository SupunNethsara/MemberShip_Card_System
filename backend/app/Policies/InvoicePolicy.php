<?php

namespace App\Policies;

use App\Models\Invoice;
use App\Models\User;

class InvoicePolicy
{
    public function viewAny(User $user): bool
    {
        return $user->can('payments.view');
    }

    /** Members may view their own invoices; staff need payments.view. */
    public function view(User $user, Invoice $invoice): bool
    {
        return $invoice->user_id === $user->id || $user->can('payments.view');
    }

    public function uploadSlip(User $user, Invoice $invoice): bool
    {
        return $invoice->user_id === $user->id && $invoice->gateway?->driver === 'manual';
    }

    public function approve(User $user, Invoice $invoice): bool
    {
        return $user->can('payments.manage');
    }
}
