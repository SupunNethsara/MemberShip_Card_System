<?php

namespace App\Services\Sms\Drivers;

use App\Models\SmsGateway;
use App\Services\Sms\Contracts\SmsDriver;
use App\Services\Sms\SmsResult;
use Illuminate\Http\Client\PendingRequest;
use Illuminate\Http\Client\Response;
use Illuminate\Support\Facades\Http;

abstract class AbstractSmsDriver implements SmsDriver
{
    public function __construct(protected SmsGateway $gateway) {}

    protected function http(): PendingRequest
    {
        return Http::timeout((int) $this->gateway->setting('timeout', 15))->acceptJson();
    }

    protected function isUnicode(string $message): bool
    {
        return (bool) preg_match('/[^\x00-\x7F]/', $message);
    }

    protected function result(Response $response, ?callable $successCheck = null, array $request = []): SmsResult
    {
        $ok = $successCheck ? (bool) $successCheck($response) : $response->successful();

        return new SmsResult($ok, $response->status(), mb_substr($response->body(), 0, 2000), $request);
    }

    protected static function field(string $key, string $label, string $type = 'text', bool $required = true, ?string $help = null, array $options = []): array
    {
        return compact('key', 'label', 'type', 'required', 'help', 'options');
    }
}
