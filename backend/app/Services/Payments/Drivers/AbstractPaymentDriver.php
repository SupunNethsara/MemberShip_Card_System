<?php

namespace App\Services\Payments\Drivers;

use App\Models\Invoice;
use App\Models\PaymentGateway;
use App\Services\Payments\Contracts\PaymentGatewayDriver;
use App\Services\Payments\WebhookResult;
use Illuminate\Http\Request;

abstract class AbstractPaymentDriver implements PaymentGatewayDriver
{
    public function __construct(protected PaymentGateway $gateway) {}

    public function handleReturn(Request $request): ?WebhookResult
    {
        return null;
    }

    protected function resultUrl(Invoice $invoice, array $extra = []): string
    {
        return config('portal.frontend_url').'/portal/payment/result?'.http_build_query(['invoice' => $invoice->number] + $extra);
    }

    protected function amount(Invoice $invoice): string
    {
        return number_format((float) $invoice->amount, 2, '.', '');
    }

    /** @return array{0:string,1:string} first & last name */
    protected function splitName(string $name): array
    {
        $parts = preg_split('/\s+/', trim($name), 2);

        return [$parts[0] ?? $name, $parts[1] ?? '-'];
    }

    protected static function field(string $key, string $label, string $type = 'text', bool $required = true, ?string $help = null, array $options = []): array
    {
        return compact('key', 'label', 'type', 'required', 'help', 'options');
    }
}
