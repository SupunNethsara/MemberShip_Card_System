<?php

namespace App\Repositories;

use App\Models\SmsLog;

class SmsLogRepository extends BaseRepository
{
    protected array $searchable = ['recipient', 'event', 'message', 'user.name'];

    protected array $sortable = ['created_at' => 'created_at', 'status' => 'status', 'event' => 'event'];

    protected string $defaultSort = 'created_at';

    protected string $defaultDirection = 'desc';

    protected array $with = ['gateway', 'user'];

    protected function model(): string
    {
        return SmsLog::class;
    }
}
