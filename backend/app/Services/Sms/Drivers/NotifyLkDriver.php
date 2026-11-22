<?php

namespace App\Services\Sms\Drivers;

use App\Services\Sms\SmsResult;

/** Notify.lk — https://developer.notify.lk/api-endpoints/ */
class NotifyLkDriver extends AbstractSmsDriver
{
    public static function definition(): array
    {
        return [
            'label' => 'Notify.lk',
            'description' => 'Sri Lankan bulk SMS with Sinhala/Tamil unicode support.',
            'credentials' => [
                static::field('user_id', 'User ID'),
                static::field('api_key', 'API Key', 'secret'),
            ],
            'settings' => [],
        ];
    }

    public function send(string $to, string $message): SmsResult
    {
        $params = [
            'user_id' => $this->gateway->credential('user_id'),
            'api_key' => $this->gateway->credential('api_key'),
            'sender_id' => $this->gateway->sender_id ?: 'NotifyDEMO',
            'to' => $to,
            'message' => $message,
        ];
        if ($this->isUnicode($message)) {
            $params['type'] = 'unicode';
        }

        $response = $this->http()->get('https://app.notify.lk/api/v1/send', $params);

        return $this->result($response, fn ($r) => $r->successful() && $r->json('status') === 'success', ['to' => $to]);
    }
}
