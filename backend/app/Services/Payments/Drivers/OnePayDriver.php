<?php

namespace App\Services\Payments\Drivers;

use App\Models\Invoice;
use App\Services\Payments\PaymentAction;
use App\Services\Payments\WebhookResult;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use RuntimeException;

/**
 * Onepay (Sri Lanka) hosted checkout — API v3.
 *
 * Mirrors the official onepay-srilanka/onepay-laravel SDK (link creation) and the official WHMCS module (callback):
 *  - Link: POST {base}/checkout/link/ with `Authorization: <app token>`, hash = sha256(app_id . currency . amount . hash_salt).
 *  - Callback: Onepay POSTs JSON {merchant_transaction_id, onepay_transaction_id, status, paid_amount, hash} to the
 *    callback URL set on the app in the Onepay merchant portal. hash = sha256(json_encode([...fields, app_id, hash_salt])).
 *
 * The browser redirect back from Onepay is NOT trusted (its hash is unsalted, so it is forgeable); it simply lands on
 * the portal result page, which polls the invoice until the signed server callback marks it paid.
 */
class OnePayDriver extends AbstractPaymentDriver
{
    public const DEFAULT_BASE_URL = 'https://api.onepay.lk/v3';

    public static function definition(): array
    {
        return [
            'label' => 'Onepay',
            'description' => 'Sri Lankan Visa, Mastercard, Amex & LANKAQR payments via Onepay hosted checkout.',
            'supports_webhook' => true,
            'credentials' => [
                static::field('app_id', 'App ID', 'text', true, 'From merchant.onepay.lk › Apps.'),
                static::field('app_token', 'App Token', 'secret', true, 'The app\'s API token (sent as the Authorization header).'),
                static::field('hash_salt', 'Hash Salt', 'secret', true, 'The app\'s hash salt. Used to sign requests and verify callbacks.'),
            ],
            'settings' => [
                static::field('api_base_url', 'API Base URL', 'text', false, 'Leave blank for '.self::DEFAULT_BASE_URL.'. Only change if Onepay gives you a different (e.g. sandbox) host.'),
            ],
        ];
    }

    protected function baseUrl(): string
    {
        $url = trim((string) $this->gateway->setting('api_base_url'));

        return rtrim($url !== '' && str_starts_with($url, 'https://') ? $url : self::DEFAULT_BASE_URL, '/');
    }

    protected function credentials(): array
    {
        $creds = [
            'app_id' => trim((string) $this->gateway->credential('app_id')),
            'app_token' => trim((string) $this->gateway->credential('app_token')),
            'hash_salt' => trim((string) $this->gateway->credential('hash_salt')),
        ];

        foreach ($creds as $key => $value) {
            if ($value === '') {
                throw new RuntimeException("Onepay {$key} is not configured.");
            }
        }

        return $creds;
    }

    public function initiate(Invoice $invoice): PaymentAction
    {
        ['app_id' => $appId, 'app_token' => $token, 'hash_salt' => $salt] = $this->credentials();

        $user = $invoice->user;
        [$first, $last] = $this->splitName($user->name);
        $currency = strtoupper($invoice->currency);
        $amount = $this->amount($invoice);

        $payload = [
            'currency' => $currency,
            'app_id' => $appId,
            'hash' => hash('sha256', $appId.$currency.$amount.$salt),
            'amount' => $amount,
            'reference' => $invoice->number, // Onepay requires 10–64 chars; echoed back as merchant_transaction_id.
            'customer_first_name' => $first,
            'customer_last_name' => $last,
            'customer_phone_number' => (string) ($user->phone ?? ''),
            'customer_email' => (string) $user->email,
            'transaction_redirect_url' => $this->resultUrl($invoice),
            'additionalData' => $invoice->number,
        ];

        $response = Http::withHeaders(['Authorization' => $token])
            ->acceptJson()
            ->asJson()
            ->timeout(30)
            ->post($this->baseUrl().'/checkout/link/', $payload);

        $redirect = $response->json('data.gateway.redirect_url') ?? $response->json('redirect_url');

        if (! $response->successful() || ! $redirect) {
            $message = $response->json('message') ?? mb_substr($response->body(), 0, 200);
            throw new RuntimeException("Onepay error ({$response->status()}): {$message}");
        }

        return new PaymentAction('redirect', $redirect, 'GET', [], [], $invoice->number, $response->json() ?? []);
    }

    public function handleWebhook(Request $request): WebhookResult
    {
        $data = $request->json()->all() ?: $request->all();

        $invoiceNo = isset($data['merchant_transaction_id']) ? trim((string) $data['merchant_transaction_id']) : null;
        $txnId = isset($data['onepay_transaction_id']) ? trim((string) $data['onepay_transaction_id']) : null;
        $status = (int) ($data['status'] ?? 0);
        $paid = (float) ($data['paid_amount'] ?? 0);
        $received = strtolower(trim((string) ($data['hash'] ?? '')));

        // Never persist the hash alongside the payload.
        $logPayload = collect($data)->except(['hash'])->all();

        try {
            ['app_id' => $appId, 'hash_salt' => $salt] = $this->credentials();
        } catch (RuntimeException $e) {
            return new WebhookResult(WebhookResult::INVALID_SIGNATURE, $invoiceNo, $txnId, null, $logPayload, $e->getMessage());
        }

        // Key order and json_encode() flags must match Onepay's reference implementation exactly.
        $expected = hash('sha256', json_encode([
            'onepay_transaction_id' => (string) $txnId,
            'merchant_transaction_id' => (string) $invoiceNo,
            'app_id' => $appId,
            'hash_salt' => $salt,
            'net_amount' => number_format($paid, 2, '.', ''),
            'status' => $status,
        ]));

        if (! $invoiceNo || ! $txnId || $received === '' || ! hash_equals($expected, $received)) {
            return new WebhookResult(WebhookResult::INVALID_SIGNATURE, $invoiceNo, $txnId, null, $logPayload, 'Onepay hash verification failed');
        }

        return new WebhookResult(
            $status === 1 ? WebhookResult::SUCCESS : WebhookResult::FAILED,
            $invoiceNo,
            $txnId,
            $paid,
            $logPayload,
            $data['status_message'] ?? ($status === 1 ? null : "Onepay status {$status}"),
        );
    }
}
