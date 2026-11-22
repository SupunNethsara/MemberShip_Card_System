<?php

namespace App\Services\Payments;

final class WebhookResult
{
    public const SUCCESS = 'success';

    public const FAILED = 'failed';

    public const PENDING = 'pending';

    public const INVALID_SIGNATURE = 'invalid_signature';

    public const IGNORED = 'ignored';

    public function __construct(
        public readonly string $status,
        public readonly ?string $invoiceNumber = null,
        public readonly ?string $reference = null,
        public readonly ?float $amount = null,
        public readonly array $payload = [],
        public readonly ?string $message = null,
    ) {}

    public function isSuccess(): bool
    {
        return $this->status === self::SUCCESS;
    }
}
