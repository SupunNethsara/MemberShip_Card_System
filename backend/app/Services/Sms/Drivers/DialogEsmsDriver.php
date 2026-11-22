<?php

namespace App\Services\Sms\Drivers;

use App\Services\Sms\SmsResult;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;
use RuntimeException;

/** Dialog eSMS v2 (token login + JSON send). */
class DialogEsmsDriver extends AbstractSmsDriver
{
    public static function definition(): array
    {
        return [
            'label' => 'Dialog eSMS',
            'description' => 'Dialog Axiata enterprise SMS (eSMS portal v2 API).',
            'credentials' => [
                static::field('username', 'Username'),
                static::field('password', 'Password', 'secret'),
            ],
            'settings' => [
                static::field('base_url', 'API Base URL', 'text', false, 'Defaults to https://esms.dialog.lk/api/v2'),
            ],
        ];
    }

    protected function baseUrl(): string
    {
        return rtrim($this->gateway->setting('base_url') ?: 'https://esms.dialog.lk/api/v2', '/');
    }

    protected function token(): string
    {
        $cacheKey = "sms.dialog.token.{$this->gateway->id}";

        return Cache::remember($cacheKey, now()->addMinutes(50), function () {
            $res = $this->http()->post($this->baseUrl().'/user/login', [
                'username' => $this->gateway->credential('username'),
                'password' => $this->gateway->credential('password'),
            ]);
            $token = $res->json('token');
            if (! $res->successful() || ! $token) {
                throw new RuntimeException('Dialog eSMS login failed: '.$res->body());
            }

            return $token;
        });
    }

    public function send(string $to, string $message): SmsResult
    {
        $response = $this->http()->withToken($this->token())->post($this->baseUrl().'/sms', [
            'msisdn' => [['mobile' => ltrim(substr($to, 2), '0')]],
            'sourceAddress' => $this->gateway->sender_id,
            'message' => $message,
            'transaction_id' => (string) (int) (microtime(true) * 1000).Str::random(2),
            'payment_method' => 0,
        ]);

        if ($response->status() === 401) {
            Cache::forget("sms.dialog.token.{$this->gateway->id}");
        }

        return $this->result($response, fn ($r) => $r->successful() && in_array($r->json('status'), ['success', 'SUCCESS'], true), ['to' => $to]);
    }
}
