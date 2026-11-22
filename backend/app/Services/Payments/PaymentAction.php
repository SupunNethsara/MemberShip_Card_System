<?php

namespace App\Services\Payments;

final class PaymentAction
{
    /**
     * @param  'redirect'|'form'|'manual'  $type
     */
    public function __construct(
        public readonly string $type,
        public readonly ?string $url = null,
        public readonly string $method = 'GET',
        public readonly array $fields = [],
        public readonly array $instructions = [],
        public readonly ?string $reference = null,
        public readonly array $raw = [],
    ) {}

    public function toArray(): array
    {
        return [
            'type' => $this->type,
            'url' => $this->url,
            'method' => $this->method,
            'fields' => $this->fields,
            'instructions' => $this->instructions,
            'reference' => $this->reference,
        ];
    }
}
