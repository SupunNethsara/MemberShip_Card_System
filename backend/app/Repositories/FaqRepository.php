<?php

namespace App\Repositories;

use App\Models\Faq;

class FaqRepository extends BaseRepository
{
    protected array $searchable = ['question->en', 'question->si', 'question->ta'];

    protected array $sortable = ['sort_order' => 'sort_order', 'created_at' => 'created_at'];

    protected string $defaultSort = 'sort_order';

    protected string $defaultDirection = 'asc';

    protected array $with = [];

    protected function model(): string
    {
        return Faq::class;
    }
}
