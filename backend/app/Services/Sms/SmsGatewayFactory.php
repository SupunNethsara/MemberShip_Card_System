<?php

namespace App\Services\Sms;

use App\Models\SmsGateway;
use App\Services\Sms\Contracts\SmsDriver;
use App\Services\Sms\Drivers\CustomHttpDriver;
use App\Services\Sms\Drivers\DialogEsmsDriver;
use App\Services\Sms\Drivers\HutchDriver;
use App\Services\Sms\Drivers\LogDriver;
use App\Services\Sms\Drivers\MobitelDriver;
use App\Services\Sms\Drivers\NotifyLkDriver;
use App\Services\Sms\Drivers\TwilioDriver;
use InvalidArgumentException;

class SmsGatewayFactory
{
    /** @var array<string, class-string<SmsDriver>> */
    public const DRIVERS = [
        'notifylk' => NotifyLkDriver::class,
        'dialog' => DialogEsmsDriver::class,
        'mobitel' => MobitelDriver::class,
        'hutch' => HutchDriver::class,
        'twilio' => TwilioDriver::class,
        'custom_http' => CustomHttpDriver::class,
        'log' => LogDriver::class,
    ];

    public function make(SmsGateway $gateway): SmsDriver
    {
        $class = self::DRIVERS[$gateway->driver] ?? throw new InvalidArgumentException("Unsupported SMS driver [{$gateway->driver}].");

        return new $class($gateway);
    }

    public static function definitions(): array
    {
        return collect(self::DRIVERS)->map(fn ($class, $key) => ['driver' => $key] + $class::definition())->values()->all();
    }
}
