<?php

namespace App\Services\Payments\Drivers;

use App\Models\Invoice;
use App\Services\Payments\PaymentAction;
use App\Services\Payments\WebhookResult;
use Illuminate\Http\Request;
use RuntimeException;

/**
 * WebXPay (Sri Lanka). The order payload is RSA-encrypted with the merchant's WebXPay public key;
 * the signed response is decrypted with the same public key and its signature compared to the payment payload.
 */
class WebXPayDriver extends AbstractPaymentDriver
{
    public static function definition(): array
    {
        return [
            'label' => 'WebXPay',
            'description' => 'Sri Lankan cards, Sampath Vishwa, FriMi & more via WebXPay.',
            'supports_webhook' => true,
            'credentials' => [
                static::field('secret_key', 'Secret Key', 'secret'),
                static::field('public_key', 'RSA Public Key (PEM)', 'secret_textarea', true, 'Paste the full -----BEGIN PUBLIC KEY----- block from your WebXPay merchant panel.'),
            ],
            'settings' => [
                static::field('enc_method', 'Encryption Method', 'text', false, 'Defaults to the WebXPay kit value.'),
            ],
        ];
    }

    protected function checkoutUrl(): string
    {
        return $this->gateway->isSandbox()
            ? 'https://stagingxpay.info/index.php?route=checkout/billing'
            : 'https://webxpay.com/index.php?route=checkout/billing';
    }

    protected function publicKey()
    {
        $pem = (string) $this->gateway->credential('public_key');
        $key = openssl_pkey_get_public($pem);
        if (! $key) {
            throw new RuntimeException('WebXPay public key is invalid or missing.');
        }

        return $key;
    }

    public function initiate(Invoice $invoice): PaymentAction
    {
        $user = $invoice->user;
        [$first, $last] = $this->splitName($user->name);

        $plain = $invoice->number.'|'.$this->amount($invoice);
        if (! openssl_public_encrypt($plain, $encrypted, $this->publicKey())) {
            throw new RuntimeException('Unable to encrypt WebXPay payment payload.');
        }

        return new PaymentAction(
            type: 'form',
            url: $this->checkoutUrl(),
            method: 'POST',
            fields: [
                'first_name' => $first,
                'last_name' => $last,
                'email' => $user->email,
                'contact_number' => $user->phone ?? '',
                'address_line_one' => 'N/A',
                'process_currency' => $invoice->currency,
                'payment' => base64_encode($encrypted),
                'secret_key' => (string) $this->gateway->credential('secret_key'),
                'custom_fields' => base64_encode($invoice->number),
                'cms' => 'PHP',
                'enc_method' => $this->gateway->setting('enc_method') ?: 'JCs3J+6oSz4V0LgE0zi/Bg==',
                'return_url' => $this->gateway->returnUrl(),
            ],
            reference: $invoice->number,
        );
    }

    public function handleWebhook(Request $request): WebhookResult
    {
        $payload = $request->only(['payment', 'signature', 'custom_fields']);

        $decode = function (?string $b64) {
            if (! $b64) {
                return null;
            }
            $ok = openssl_public_decrypt(base64_decode($b64), $out, $this->publicKey());

            return $ok ? $out : null;
        };

        $payment = $decode($payload['payment'] ?? null);
        $signature = $decode($payload['signature'] ?? null);

        if (! $payment || ! $signature || ! hash_equals($payment, $signature)) {
            return new WebhookResult(WebhookResult::INVALID_SIGNATURE, null, null, null, $payload, 'WebXPay signature verification failed');
        }

        // order_id | order_reference | datetime | gateway | status_code | comment
        $parts = explode('|', $payment);
        $statusCode = $parts[4] ?? '';

        return new WebhookResult(
            in_array($statusCode, ['0', '00'], true) ? WebhookResult::SUCCESS : WebhookResult::FAILED,
            $parts[0] ?? base64_decode($payload['custom_fields'] ?? ''),
            $parts[1] ?? null,
            null,
            $payload + ['decoded' => $parts],
            $parts[5] ?? null,
        );
    }

    public function handleReturn(Request $request): ?WebhookResult
    {
        return $this->handleWebhook($request);
    }
}
