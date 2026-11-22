<?php

namespace App\Services\Sms\Drivers;

use App\Services\Sms\SmsResult;

class TwilioDriver extends AbstractSmsDriver
{
    public static function definition(): array
    {
        return [
            'label' => 'Twilio',
            'description' => 'Global programmable SMS via Twilio Messaging API.',
            'credentials' => [
                static::field('account_sid', 'Account SID'),
                static::field('auth_token', 'Auth Token', 'secret'),
            ],
            'settings' => [
                static::field('messaging_service_sid', 'Messaging Service SID', 'text', false, 'Optional; overrides the Sender ID as "From".'),
            ],
        ];
    }

    public function send(string $to, string $message): SmsResult
    {
        $sid = (string) $this->gateway->credential('account_sid');
        $payload = ['To' => '+'.$to, 'Body' => $message];

        if ($svc = $this->gateway->setting('messaging_service_sid')) {
            $payload['MessagingServiceSid'] = $svc;
        } else {
            $payload['From'] = $this->gateway->sender_id;
        }

        $response = $this->http()
            ->asForm()
            ->withBasicAuth($sid, (string) $this->gateway->credential('auth_token'))
            ->post("https://api.twilio.com/2010-04-01/Accounts/{$sid}/Messages.json", $payload);

        return $this->result($response, null, ['to' => $to]);
    }
}
