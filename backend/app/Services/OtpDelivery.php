<?php

namespace App\Services;

use App\Mail\OtpCodeMail;
use App\Models\User;
use App\Services\Sms\SmsService;
use Illuminate\Support\Facades\Mail;
use Throwable;

/**
 * Delivers one-time codes (registration, password reset).
 *
 * SMS is used when a real SMS gateway is active. Until one is set up — no active gateway, or only the
 * development "log" driver, which never reaches a phone — the code is emailed instead. If a real gateway
 * is set up but the SMS fails, the email is the fallback. Adding a real gateway in Admin › SMS gateways
 * switches OTPs back to SMS with no other change.
 */
class OtpDelivery
{
    public function __construct(private readonly SmsService $sms) {}

    /** True when an active gateway can actually reach a phone (the "log" driver only writes to a file). */
    public function smsReady(): bool
    {
        return $this->sms->enabled()
            && $this->sms->gatewayChain()->contains(fn ($gateway) => $gateway->driver !== 'log');
    }

    /**
     * @param  string  $event  'otp' (registration) or 'password_reset_otp'
     * @return array{channel: 'sms'|'email', destination: string}
     */
    public function send(string $phone, ?string $email, string $smsMessage, string $code, string $event, string $locale, ?User $user = null, ?string $name = null): array
    {
        if ($this->smsReady()) {
            $log = $this->sms->send($phone, $smsMessage, $event, $user, null, $locale);
            if ($log?->status === 'sent' || ! $email) {
                return ['channel' => 'sms', 'destination' => self::maskPhone($phone)];
            }
        }

        if ($email) {
            try {
                Mail::to($email)->send(new OtpCodeMail($code, $event, $locale, $name));

                return ['channel' => 'email', 'destination' => self::maskEmail($email)];
            } catch (Throwable $e) {
                report($e); // e.g. mail server not configured — fall through so the code is at least logged
            }
        }

        // No usable email either: hand it to the SMS chain anyway (in development the log driver records it).
        $this->sms->send($phone, $smsMessage, $event, $user, null, $locale);

        return ['channel' => 'sms', 'destination' => self::maskPhone($phone)];
    }

    public static function maskPhone(string $phone): string
    {
        return strlen($phone) > 7 ? substr($phone, 0, 4).'****'.substr($phone, -3) : $phone;
    }

    public static function maskEmail(string $email): string
    {
        [$local, $domain] = array_pad(explode('@', $email, 2), 2, '');

        return mb_substr($local, 0, 1).str_repeat('*', max(2, min(6, mb_strlen($local) - 1))).'@'.$domain;
    }
}
