<?php

namespace App\Services\Payments\Drivers;

use App\Models\Invoice;
use App\Services\Payments\PaymentAction;
use App\Services\Payments\WebhookResult;
use Illuminate\Http\Request;

/**
 * PayHere (Sri Lanka) hosted checkout.
 * Docs: https://support.payhere.lk/api-&-mobile-sdk/checkout-api
 */
class PayHereDriver extends AbstractPaymentDriver
{
    public static function definition(): array
    {
        return [
            'label' => 'PayHere',
            'description' => 'Sri Lankan card, eZ Cash, mCash & bank payments via PayHere hosted checkout.',
            'supports_webhook' => true,
            'credentials' => [
                static::field('merchant_id', 'Merchant ID'),
                static::field('merchant_secret', 'Merchant Secret', 'secret', true, 'Generated per domain/app under Settings > Domains & Credentials.'),
            ],
            'settings' => [],
        ];
    }

    protected function checkoutUrl(): string
    {
        return $this->gateway->isSandbox()
            ? 'https://sandbox.payhere.lk/pay/checkout'
            : 'https://www.payhere.lk/pay/checkout';
    }

    protected function secretHash(): string
    {
        return strtoupper(md5((string) $this->gateway->credential('merchant_secret')));
    }

    public function initiate(Invoice $invoice): PaymentAction
    {
        $user = $invoice->user;
        [$first, $last] = $this->splitName($user->name);
        $merchantId = (string) $this->gateway->credential('merchant_id');
        $amount = $this->amount($invoice);

        $hash = strtoupper(md5($merchantId.$invoice->number.$amount.$invoice->currency.$this->secretHash()));

        return new PaymentAction(
            type: 'form',
            url: $this->checkoutUrl(),
            method: 'POST',
            fields: [
                'merchant_id' => $merchantId,
                'return_url' => $this->resultUrl($invoice),
                'cancel_url' => $this->resultUrl($invoice, ['cancelled' => 1]),
                'notify_url' => $this->gateway->webhookUrl(),
                'order_id' => $invoice->number,
                'items' => $invoice->tier->translate('name', 'en').' Membership',
                'currency' => $invoice->currency,
                'amount' => $amount,
                'first_name' => $first,
                'last_name' => $last,
                'email' => $user->email,
                'phone' => $user->phone ?? '',
                'address' => 'N/A',
                'city' => 'Colombo',
                'country' => 'Sri Lanka',
                'hash' => $hash,
            ],
            reference: $invoice->number,
        );
    }

    public function handleWebhook(Request $request): WebhookResult
    {
        $p = $request->only(['merchant_id', 'order_id', 'payment_id', 'payhere_amount', 'payhere_currency', 'status_code', 'md5sig', 'method', 'status_message']);

        $expected = strtoupper(md5(
            ($p['merchant_id'] ?? '').($p['order_id'] ?? '').($p['payhere_amount'] ?? '').
            ($p['payhere_currency'] ?? '').($p['status_code'] ?? '').$this->secretHash()
        ));

        if (! hash_equals($expected, strtoupper((string) ($p['md5sig'] ?? '')))
            || ($p['merchant_id'] ?? null) !== (string) $this->gateway->credential('merchant_id')) {
            return new WebhookResult(WebhookResult::INVALID_SIGNATURE, $p['order_id'] ?? null, $p['payment_id'] ?? null, null, $p, 'md5sig mismatch');
        }

        $status = match ((string) ($p['status_code'] ?? '')) {
            '2' => WebhookResult::SUCCESS,
            '0' => WebhookResult::PENDING,
            default => WebhookResult::FAILED, // -1 cancelled, -2 failed, -3 chargeback
        };

        return new WebhookResult($status, $p['order_id'], $p['payment_id'] ?? null, (float) $p['payhere_amount'], $p, $p['status_message'] ?? null);
    }
}
