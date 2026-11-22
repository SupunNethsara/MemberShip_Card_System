<?php

namespace App\Repositories;

use App\Models\Partner;

class PartnerRepository extends BaseRepository
{
    protected array $searchable = ['name->en', 'name->si', 'name->ta', 'city', 'email', 'phone'];

    protected array $sortable = ['name' => 'name->en', 'city' => 'city', 'created_at' => 'created_at'];

    protected string $defaultSort = 'created_at';

    protected string $defaultDirection = 'desc';

    protected array $with = ['category'];

    protected function model(): string
    {
        return Partner::class;
    }
}
