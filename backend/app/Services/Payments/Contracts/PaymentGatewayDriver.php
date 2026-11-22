<?php

namespace App\Services\Payments\Contracts;

use App\Models\Invoice;
use App\Models\PaymentGateway;
use App\Services\Payments\PaymentAction;
use App\Services\Payments\WebhookResult;
use Illuminate\Http\Request;

interface PaymentGatewayDriver
{
    public function __construct(PaymentGateway $gateway);

    /**
     * Driver metadata for the admin UI: label, description, credential & setting field schema.
     *
     * @return array{label:string, description:string, credentials:array, settings:array, supports_webhook:bool}
     */
    public static function definition(): array;

    /** Builds what the browser must do to pay this invoice (redirect, auto-submit form, or manual instructions). */
    public function initiate(Invoice $invoice): PaymentAction;

    /** Verifies the provider callback cryptographically and maps it to a normalized result. */
    public function handleWebhook(Request $request): WebhookResult;

    /** Optional browser-return processing (e.g. WebXPay posts the signed result back with the customer). */
    public function handleReturn(Request $request): ?WebhookResult;
}
