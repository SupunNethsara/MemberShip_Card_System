<?php

namespace App\Repositories;

use App\Models\BusinessCategory;

class CategoryRepository extends BaseRepository
{
    protected array $searchable = ['name->en', 'name->si', 'name->ta', 'slug'];

    protected array $sortable = ['sort_order' => 'sort_order', 'name' => 'name->en'];

    protected string $defaultSort = 'sort_order';

    protected string $defaultDirection = 'asc';

    protected array $with = [];

    protected function model(): string
    {
        return BusinessCategory::class;
    }
}
