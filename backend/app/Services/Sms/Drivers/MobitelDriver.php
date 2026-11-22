<?php

namespace App\Services\Sms\Drivers;

use App\Services\Sms\SmsResult;

/** Mobitel Enterprise SMS HTTP proxy (esmsproxy). */
class MobitelDriver extends AbstractSmsDriver
{
    public static function definition(): array
    {
        return [
            'label' => 'Mobitel eSMS (HTTP)',
            'description' => 'SLT-Mobitel Enterprise SMS over the HTTP proxy API.',
            'credentials' => [
                static::field('username', 'Username'),
                static::field('password', 'Password', 'secret'),
            ],
            'settings' => [
                static::field('endpoint', 'Endpoint URL', 'text', false, 'Defaults to https://msmsenterpriseapi.mobitel.lk/EnterpriseSMSV3/esmsproxy_multilang.php'),
            ],
        ];
    }

    public function send(string $to, string $message): SmsResult
    {
        $endpoint = $this->gateway->setting('endpoint') ?: 'https://msmsenterpriseapi.mobitel.lk/EnterpriseSMSV3/esmsproxy_multilang.php';

        $response = $this->http()->get($endpoint, [
            'u' => $this->gateway->credential('username'),
            'p' => $this->gateway->credential('password'),
            'r' => '0'.substr($to, 2),
            'a' => $this->gateway->sender_id,
            'm' => $message,
            't' => $this->isUnicode($message) ? 1 : 0,
        ]);

        // The proxy returns "200" in the body on success.
        return $this->result($response, fn ($r) => $r->successful() && trim($r->body()) === '200', ['to' => $to]);
    }
}
