<?php

namespace App\Repositories;

use App\Models\Offer;

class OfferRepository extends BaseRepository
{
    protected array $searchable = ['title->en', 'title->si', 'title->ta', 'partner.name'];

    protected array $sortable = ['title' => 'title->en', 'ends_at' => 'ends_at', 'discount_value' => 'discount_value', 'created_at' => 'created_at'];

    protected string $defaultSort = 'created_at';

    protected string $defaultDirection = 'desc';

    protected array $with = ['partner.category', 'tiers'];

    protected function model(): string
    {
        return Offer::class;
    }
}
