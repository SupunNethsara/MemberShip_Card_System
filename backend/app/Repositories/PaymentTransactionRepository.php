<?php

namespace App\Repositories;

use App\Models\PaymentTransaction;

class PaymentTransactionRepository extends BaseRepository
{
    protected array $searchable = ['reference', 'invoice.number'];

    protected array $sortable = ['created_at' => 'created_at', 'status' => 'status'];

    protected string $defaultSort = 'created_at';

    protected string $defaultDirection = 'desc';

    protected array $with = ['invoice.user', 'gateway'];

    protected function model(): string
    {
        return PaymentTransaction::class;
    }
}
