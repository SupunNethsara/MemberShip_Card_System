<?php

namespace App\Services\Payments\Drivers;

use App\Models\Invoice;
use App\Services\Payments\PaymentAction;
use App\Services\Payments\WebhookResult;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use RuntimeException;

/**
 * Stripe Checkout Sessions over the REST API (no SDK dependency).
 * Webhook signature: HMAC-SHA256("{t}.{payload}", whsec) compared against v1 in the Stripe-Signature header.
 */
class StripeDriver extends AbstractPaymentDriver
{
    private const TOLERANCE_SECONDS = 300;

    public static function definition(): array
    {
        return [
            'label' => 'Stripe',
            'description' => 'International cards, Apple Pay & Google Pay via Stripe Checkout.',
            'supports_webhook' => true,
            'credentials' => [
                static::field('publishable_key', 'Publishable Key', 'text', false),
                static::field('secret_key', 'Secret Key', 'secret', true, 'sk_test_… in sandbox, sk_live_… in live mode.'),
                static::field('webhook_secret', 'Webhook Signing Secret', 'secret', true, 'whsec_… from the webhook endpoint you create with the URL below. Subscribe to checkout.session.completed.'),
            ],
            'settings' => [],
        ];
    }

    public function initiate(Invoice $invoice): PaymentAction
    {
        $secret = (string) $this->gateway->credential('secret_key');
        if ($secret === '') {
            throw new RuntimeException('Stripe secret key is not configured.');
        }

        // LKR is a two-decimal currency in Stripe: amount is in cents.
        $response = Http::asForm()->withToken($secret)->post('https://api.stripe.com/v1/checkout/sessions', [
            'mode' => 'payment',
            'success_url' => $this->resultUrl($invoice),
            'cancel_url' => $this->resultUrl($invoice, ['cancelled' => 1]),
            'client_reference_id' => $invoice->number,
            'customer_email' => $invoice->user->email,
            'metadata[invoice]' => $invoice->number,
            'line_items[0][quantity]' => 1,
            'line_items[0][price_data][currency]' => strtolower($invoice->currency),
            'line_items[0][price_data][unit_amount]' => (int) round(((float) $invoice->amount) * 100),
            'line_items[0][price_data][product_data][name]' => $invoice->tier->translate('name', 'en').' Membership',
        ]);

        if (! $response->successful()) {
            throw new RuntimeException('Stripe error: '.$response->json('error.message', $response->body()));
        }

        return new PaymentAction('redirect', $response->json('url'), 'GET', [], [], $response->json('id'), $response->json());
    }

    public function handleWebhook(Request $request): WebhookResult
    {
        $payload = $request->getContent();
        $header = (string) $request->header('Stripe-Signature');
        $secret = (string) $this->gateway->credential('webhook_secret');

        $parts = collect(explode(',', $header))->mapWithKeys(function ($kv) {
            [$k, $v] = array_pad(explode('=', trim($kv), 2), 2, null);

            return [$k => $v];
        });
        $timestamp = (int) $parts->get('t');
        $signature = (string) $parts->get('v1');
        $expected = hash_hmac('sha256', $timestamp.'.'.$payload, $secret);

        $data = json_decode($payload, true) ?: [];

        if ($secret === '' || ! $signature || ! hash_equals($expected, $signature) || abs(time() - $timestamp) > self::TOLERANCE_SECONDS) {
            return new WebhookResult(WebhookResult::INVALID_SIGNATURE, null, null, null, $data, 'Stripe-Signature verification failed');
        }

        $type = $data['type'] ?? '';
        $session = $data['data']['object'] ?? [];
        $invoiceNo = $session['client_reference_id'] ?? ($session['metadata']['invoice'] ?? null);
        $amount = isset($session['amount_total']) ? $session['amount_total'] / 100 : null;

        return match ($type) {
            'checkout.session.completed', 'checkout.session.async_payment_succeeded' => new WebhookResult(
                ($session['payment_status'] ?? '') === 'paid' ? WebhookResult::SUCCESS : WebhookResult::PENDING,
                $invoiceNo, $session['payment_intent'] ?? $session['id'] ?? null, $amount, $data
            ),
            'checkout.session.expired', 'checkout.session.async_payment_failed' => new WebhookResult(WebhookResult::FAILED, $invoiceNo, $session['id'] ?? null, $amount, $data),
            default => new WebhookResult(WebhookResult::IGNORED, $invoiceNo, null, null, $data, "Unhandled event {$type}"),
        };
    }
}
