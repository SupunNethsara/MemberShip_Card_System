<?php

namespace App\Services\Payments\Drivers;

use App\Models\Invoice;
use App\Services\Payments\PaymentAction;
use App\Services\Payments\WebhookResult;
use Illuminate\Http\Request;

/** Offline bank transfer: the member uploads a deposit slip, finance approves it manually. */
class ManualTransferDriver extends AbstractPaymentDriver
{
    public static function definition(): array
    {
        return [
            'label' => 'Manual Bank Transfer',
            'description' => 'Member transfers to your bank account and uploads the slip for approval.',
            'supports_webhook' => false,
            'credentials' => [],
            'settings' => [
                static::field('bank_name', 'Bank Name'),
                static::field('account_name', 'Account Name'),
                static::field('account_number', 'Account Number'),
                static::field('branch', 'Branch', 'text', false),
                static::field('swift', 'SWIFT Code', 'text', false),
                static::field('instructions', 'Additional Instructions', 'textarea', false),
            ],
        ];
    }

    public function initiate(Invoice $invoice): PaymentAction
    {
        return new PaymentAction(
            type: 'manual',
            instructions: [
                'bank_name' => $this->gateway->setting('bank_name'),
                'account_name' => $this->gateway->setting('account_name'),
                'account_number' => $this->gateway->setting('account_number'),
                'branch' => $this->gateway->setting('branch'),
                'swift' => $this->gateway->setting('swift'),
                'instructions' => $this->gateway->setting('instructions'),
                'reference' => $invoice->number,
                'amount' => $this->amount($invoice),
                'currency' => $invoice->currency,
            ],
            reference: $invoice->number,
        );
    }

    public function handleWebhook(Request $request): WebhookResult
    {
        return new WebhookResult(WebhookResult::IGNORED, message: 'Manual transfers have no webhook.');
    }
}
