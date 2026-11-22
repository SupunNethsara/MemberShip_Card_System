<?php

namespace App\Repositories;

use App\Models\Invoice;

class InvoiceRepository extends BaseRepository
{
    protected array $searchable = ['number', 'user.name', 'user.email', 'user.member_code'];

    protected array $sortable = ['number' => 'number', 'amount' => 'amount', 'status' => 'status', 'paid_at' => 'paid_at', 'created_at' => 'created_at'];

    protected string $defaultSort = 'created_at';

    protected string $defaultDirection = 'desc';

    protected array $with = ['user', 'tier', 'gateway'];

    protected function model(): string
    {
        return Invoice::class;
    }
}
