<?php

namespace App\Services\Sms\Drivers;

use App\Services\Sms\SmsResult;

/**
 * Admin-defined HTTP/REST provider. Placeholders available in URL, headers and payload values:
 * {to}, {to_local}, {message}, {sender}, {api_key}, {username}, {password}.
 */
class CustomHttpDriver extends AbstractSmsDriver
{
    public static function definition(): array
    {
        return [
            'label' => 'Custom HTTP / REST',
            'description' => 'Any provider with an HTTP API. Map the endpoint, headers and payload yourself.',
            'credentials' => [
                static::field('api_key', 'API Key / Token', 'secret', false, 'Available as {api_key}.'),
                static::field('username', 'Username', 'text', false, 'Available as {username}.'),
                static::field('password', 'Password', 'secret', false, 'Available as {password}.'),
            ],
            'settings' => [
                static::field('endpoint', 'Endpoint URL', 'text', true, 'e.g. https://api.provider.lk/send?key={api_key}'),
                static::field('method', 'HTTP Method', 'select', true, null, ['GET', 'POST', 'PUT']),
                static::field('body_format', 'Payload Format', 'select', true, 'GET always sends as query string.', ['query', 'json', 'form']),
                static::field('headers', 'Headers', 'keyvalue', false, 'e.g. Authorization: Bearer {api_key}'),
                static::field('payload', 'Payload Mapping', 'keyvalue', true, 'e.g. to = {to}, text = {message}, from = {sender}'),
                static::field('success_contains', 'Success Indicator', 'text', false, 'Substring expected in the response body. Blank = any 2xx.'),
            ],
        ];
    }

    public function send(string $to, string $message): SmsResult
    {
        $vars = [
            '{to}' => $to,
            '{to_local}' => '0'.substr($to, 2),
            '{message}' => $message,
            '{sender}' => (string) $this->gateway->sender_id,
            '{api_key}' => (string) $this->gateway->credential('api_key'),
            '{username}' => (string) $this->gateway->credential('username'),
            '{password}' => (string) $this->gateway->credential('password'),
        ];
        $fill = fn ($v) => strtr((string) $v, $vars);

        $pairs = fn ($list) => collect($list ?: [])
            ->filter(fn ($row) => ! empty($row['key']))
            ->mapWithKeys(fn ($row) => [$row['key'] => $fill($row['value'] ?? '')])
            ->all();

        $url = $fill($this->gateway->setting('endpoint'));
        $method = strtoupper($this->gateway->setting('method', 'POST'));
        $format = $this->gateway->setting('body_format', 'json');
        $headers = $pairs($this->gateway->setting('headers'));
        $payload = $pairs($this->gateway->setting('payload'));

        $req = $this->http()->withHeaders($headers);

        $response = match (true) {
            $method === 'GET' => $req->get($url, $payload),
            $format === 'form' => $req->asForm()->send($method, $url, ['form_params' => $payload]),
            $format === 'query' => $req->send($method, $url, ['query' => $payload]),
            default => $req->asJson()->send($method, $url, ['json' => $payload]),
        };

        $needle = $this->gateway->setting('success_contains');

        return $this->result(
            $response,
            fn ($r) => $r->successful() && (! $needle || str_contains($r->body(), $needle)),
            ['url' => preg_replace('/(key|token|password)=[^&]+/i', '$1=***', $url), 'method' => $method]
        );
    }
}
