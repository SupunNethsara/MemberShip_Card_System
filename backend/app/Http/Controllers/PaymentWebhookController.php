<?php

namespace App\Http\Controllers;

use App\Models\PaymentGateway;
use App\Services\Payments\PaymentService;
use App\Services\Payments\WebhookResult;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

/** Public, unauthenticated endpoints called by payment providers. Trust comes only from driver signature checks. */
class PaymentWebhookController extends Controller
{
    public function __construct(private readonly PaymentService $payments) {}

    public function webhook(Request $request, string $key): JsonResponse
    {
        $gateway = PaymentGateway::query()->where('webhook_key', $key)->firstOrFail();
        $result = $this->payments->handleWebhook($gateway, $request);

        $status = $result->status === WebhookResult::INVALID_SIGNATURE ? 400 : 200;

        return response()->json(['status' => $result->status], $status);
    }

    /** Browser return (e.g. WebXPay posts the signed result back with the customer). */
    public function return(Request $request, string $key): RedirectResponse
    {
        $gateway = PaymentGateway::query()->where('webhook_key', $key)->firstOrFail();
        $result = $this->payments->handleWebhook($gateway, $request, 'return');

        return redirect()->away(config('portal.frontend_url').'/portal/payment/result?'.http_build_query([
            'invoice' => $result->invoiceNumber,
            'status' => $result->status,
        ]));
    }
}
