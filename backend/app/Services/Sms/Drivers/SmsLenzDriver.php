<?php

namespace App\Services\Sms\Drivers;

use App\Services\Sms\SmsResult;

/**
 * SMSLenz — https://smslenz.lk
 * Sri Lankan Bulk SMS & OTP Gateway
 * Official API documentation: https://smslenz.lk/developers/api
 */
class SmsLenzDriver extends AbstractSmsDriver
{
    public static function definition(): array
    {
        return [
            'label' => 'SMSLenz (smslenz.lk)',
            'description' => 'Sri Lankan bulk SMS & OTP gateway with instant delivery across Dialog, Mobitel, Hutch, and Airtel.',
            'credentials' => [
                static::field('user_id', 'User ID', 'text', true, 'Found in your SMSLenz account dashboard'),
                static::field('api_key', 'API Key', 'secret', true, 'Obtained from https://smslenz.lk/account/api-key'),
            ],
            'settings' => [
                static::field('endpoint', 'API Endpoint', 'text', false, 'Defaults to https://smslenz.lk/api/send-sms'),
            ],
        ];
    }

    public function send(string $to, string $message): SmsResult
    {
        $endpoint = $this->gateway->setting('endpoint') ?: 'https://smslenz.lk/api/send-sms';

        // SMSLenz requires contact in the format +9476XXXXXXX
        $digits = preg_replace('/[^\d]/', '', $to);
        if (str_starts_with($digits, '0')) {
            $digits = '94'.substr($digits, 1);
        } elseif (! str_starts_with($digits, '94')) {
            $digits = '94'.$digits;
        }
        $contact = '+'.$digits;

        $payload = [
            'user_id' => $this->gateway->credential('user_id'),
            'api_key' => $this->gateway->credential('api_key'),
            'sender_id' => $this->gateway->sender_id ?: 'SMSlenzDEMO',
            'contact' => $contact,
            'message' => $message,
        ];

        $response = $this->http()->post($endpoint, $payload);

        return $this->result(
            $response,
            fn ($r) => $r->successful() && ($r->json('success') === true || $r->json('data.status') === 'success'),
            ['contact' => $contact, 'sender_id' => $payload['sender_id']]
        );
    }

    /**
     * Optional live balance query from https://smslenz.lk/api/account-status
     */
    public function checkAccountStatus(): ?array
    {
        $userId = $this->gateway->credential('user_id');
        $apiKey = $this->gateway->credential('api_key');
        if (! $userId || ! $apiKey) {
            return null;
        }

        try {
            $response = $this->http()->post('https://smslenz.lk/api/account-status', [
                'user_id' => $userId,
                'api_key' => $apiKey,
            ]);

            if ($response->successful() && $response->json('success')) {
                return $response->json('data');
            }
        } catch (\Throwable) {
        }

        return null;
    }
}
