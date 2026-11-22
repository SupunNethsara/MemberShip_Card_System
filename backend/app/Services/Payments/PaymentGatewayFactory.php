<?php

namespace App\Services\Payments;

use App\Models\PaymentGateway;
use App\Services\Payments\Contracts\PaymentGatewayDriver;
use App\Services\Payments\Drivers\ManualTransferDriver;
use App\Services\Payments\Drivers\PayHereDriver;
use App\Services\Payments\Drivers\StripeDriver;
use App\Services\Payments\Drivers\WebXPayDriver;
use InvalidArgumentException;

class PaymentGatewayFactory
{
    /** @var array<string, class-string<PaymentGatewayDriver>> */
    public const DRIVERS = [
        'payhere' => PayHereDriver::class,
        'stripe' => StripeDriver::class,
        'webxpay' => WebXPayDriver::class,
        'manual' => ManualTransferDriver::class,
    ];

    public function make(PaymentGateway $gateway): PaymentGatewayDriver
    {
        $class = self::DRIVERS[$gateway->driver] ?? throw new InvalidArgumentException("Unsupported payment driver [{$gateway->driver}].");

        return new $class($gateway);
    }

    /** Resolves the gateway to use at checkout: the requested active one, else the default active one. */
    public function resolve(?int $gatewayId = null): PaymentGateway
    {
        $query = PaymentGateway::query()->active();

        $gateway = $gatewayId
            ? (clone $query)->find($gatewayId)
            : (clone $query)->orderByDesc('is_default')->orderBy('sort_order')->first();

        return $gateway ?? throw new InvalidArgumentException('The selected payment method is not available.');
    }

    public static function definitions(): array
    {
        return collect(self::DRIVERS)->map(fn ($class, $key) => ['driver' => $key] + $class::definition())->values()->all();
    }
}
