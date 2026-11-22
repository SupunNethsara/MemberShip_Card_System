<?php

namespace App\Services\Sms;

use App\Models\Setting;
use App\Models\SmsGateway;
use App\Models\SmsLog;
use App\Models\SmsTemplate;
use App\Models\User;
use App\Support\Phone;
use Illuminate\Support\Collection;
use Throwable;

class SmsService
{
    public function __construct(private readonly SmsGatewayFactory $factory) {}

    public function enabled(): bool
    {
        return (bool) Setting::get('sms.enabled', true);
    }

    /** Primary active gateway first, then the fallback, then any remaining active gateway. */
    public function gatewayChain(): Collection
    {
        return SmsGateway::query()
            ->where('is_active', true)
            ->orderByDesc('is_primary')
            ->orderByDesc('is_fallback')
            ->orderBy('id')
            ->get()
            ->take(2);
    }

    /** Renders and dispatches an event template to a user in their preferred language. Never throws. */
    public function sendEvent(string $event, User $user, array $vars = []): ?SmsLog
    {
        if (! $this->enabled() || ! $user->phone) {
            return null;
        }

        $template = SmsTemplate::query()->where('event', $event)->where('is_active', true)->first();
        if (! $template) {
            return null;
        }

        $locale = in_array($user->preferred_locale, config('portal.locales'), true) ? $user->preferred_locale : 'en';
        $message = $template->render($locale, $vars + [
            'member_name' => $user->name,
            'member_id' => $user->member_code,
            'site_name' => Setting::get('site.name', config('app.name')),
        ]);

        return $this->send($user->phone, $message, $event, $user, null, $locale);
    }

    /**
     * Sends a message through a specific gateway, or through the primary→fallback chain.
     * Every attempt is written to sms_logs.
     */
    public function send(string $phone, string $message, string $event = 'manual', ?User $user = null, ?SmsGateway $gateway = null, string $locale = 'en'): ?SmsLog
    {
        $to = Phone::normalize($phone);
        if (! $to) {
            return null;
        }

        $chain = $gateway ? collect([$gateway]) : $this->gatewayChain();
        $log = null;

        foreach ($chain as $gw) {
            try {
                $result = $this->factory->make($gw)->send($to, $message);
            } catch (Throwable $e) {
                $result = SmsResult::fromException($e);
            }

            $log = SmsLog::query()->create([
                'user_id' => $user?->id,
                'sms_gateway_id' => $gw->id,
                'recipient' => $to,
                'event' => $event,
                'locale' => $locale,
                'message' => $message,
                'status' => $result->success ? 'sent' : 'failed',
                'http_status' => $result->httpStatus,
                'provider_response' => $result->response,
                'segments' => $this->segments($message),
            ]);

            if ($result->success) {
                break;
            }
        }

        return $log;
    }

    public function segments(string $message): int
    {
        $unicode = (bool) preg_match('/[^\x00-\x7F]/', $message);
        $len = mb_strlen($message);
        [$single, $multi] = $unicode ? [70, 67] : [160, 153];

        return $len <= $single ? 1 : (int) ceil($len / $multi);
    }
}
