<?php

namespace App\Repositories;

use App\Models\MembershipTier;

class TierRepository extends BaseRepository
{
    protected array $searchable = ['name->en', 'name->si', 'name->ta', 'slug'];

    protected array $sortable = ['priority' => 'priority', 'price' => 'price', 'name' => 'name->en', 'created_at' => 'created_at'];

    protected string $defaultSort = 'priority';

    protected string $defaultDirection = 'asc';

    protected array $with = [];

    protected function model(): string
    {
        return MembershipTier::class;
    }
}
