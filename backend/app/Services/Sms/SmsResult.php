<?php

namespace App\Services\Sms;

final class SmsResult
{
    public function __construct(
        public readonly bool $success,
        public readonly ?int $httpStatus = null,
        public readonly ?string $response = null,
        public readonly array $request = [],
    ) {}

    public static function fromException(\Throwable $e): self
    {
        return new self(false, null, get_class($e).': '.$e->getMessage());
    }
}
