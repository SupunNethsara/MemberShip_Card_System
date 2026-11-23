<?php

namespace App\Repositories;

use App\Models\ContactInquiry;

class ContactInquiryRepository extends BaseRepository
{
    protected array $searchable = ['name', 'email', 'phone', 'message'];

    protected array $sortable = ['created_at' => 'created_at', 'status' => 'status', 'name' => 'name'];

    protected string $defaultSort = 'created_at';

    protected string $defaultDirection = 'desc';

    protected array $with = ['handler'];

    protected function model(): string
    {
        return ContactInquiry::class;
    }
}
