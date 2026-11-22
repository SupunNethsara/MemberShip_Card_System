<?php

namespace App\Repositories;

use App\Models\AuditLog;

class AuditLogRepository extends BaseRepository
{
    protected array $searchable = ['action', 'description', 'user.name', 'ip_address'];

    protected array $sortable = ['created_at' => 'created_at', 'action' => 'action'];

    protected string $defaultSort = 'created_at';

    protected string $defaultDirection = 'desc';

    protected array $with = ['user'];

    protected function model(): string
    {
        return AuditLog::class;
    }
}
