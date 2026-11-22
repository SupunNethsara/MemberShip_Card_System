<?php

namespace App\Services\Sms\Drivers;

use App\Services\Sms\SmsResult;
use Illuminate\Support\Facades\Cache;
use RuntimeException;

/** Hutch BSMS REST API (token login + send). */
class HutchDriver extends AbstractSmsDriver
{
    public static function definition(): array
    {
        return [
            'label' => 'Hutch BSMS (HTTP)',
            'description' => 'Hutchison Telecom Lanka business SMS REST API.',
            'credentials' => [
                static::field('username', 'Username'),
                static::field('password', 'Password', 'secret'),
            ],
            'settings' => [
                static::field('base_url', 'API Base URL', 'text', false, 'Defaults to https://bsms.hutch.lk/api'),
            ],
        ];
    }

    protected function baseUrl(): string
    {
        return rtrim($this->gateway->setting('base_url') ?: 'https://bsms.hutch.lk/api', '/');
    }

    protected function token(): string
    {
        return Cache::remember("sms.hutch.token.{$this->gateway->id}", now()->addMinutes(50), function () {
            $res = $this->http()->withHeaders(['X-API-VERSION' => 'v1'])->post($this->baseUrl().'/login', [
                'username' => $this->gateway->credential('username'),
                'password' => $this->gateway->credential('password'),
            ]);
            $token = $res->json('accessToken');
            if (! $res->successful() || ! $token) {
                throw new RuntimeException('Hutch login failed: '.$res->body());
            }

            return $token;
        });
    }

    public function send(string $to, string $message): SmsResult
    {
        $response = $this->http()
            ->withHeaders(['X-API-VERSION' => 'v1'])
            ->withToken($this->token())
            ->post($this->baseUrl().'/sendsms', [
                'campaignName' => 'membership-portal',
                'mask' => $this->gateway->sender_id,
                'numbers' => $to,
                'content' => $message,
            ]);

        if ($response->status() === 401) {
            Cache::forget("sms.hutch.token.{$this->gateway->id}");
        }

        return $this->result($response, null, ['to' => $to]);
    }
}
