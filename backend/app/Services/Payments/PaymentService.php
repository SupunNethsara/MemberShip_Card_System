<?php

namespace App\Services\Payments;

use App\Models\Invoice;
use App\Models\MembershipTier;
use App\Models\PaymentGateway;
use App\Models\PaymentTransaction;
use App\Models\User;
use App\Notifications\PortalNotification;
use App\Services\AuditLogger;
use App\Services\MembershipService;
use App\Services\Sms\SmsService;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Notification;
use Illuminate\Validation\ValidationException;
use Throwable;

class PaymentService
{
    public function __construct(
        private readonly PaymentGatewayFactory $factory,
        private readonly MembershipService $memberships,
        private readonly SmsService $sms,
        private readonly AuditLogger $audit,
    ) {}

    /**
     * Creates an invoice for the selected tier and asks the gateway driver how the browser should pay it.
     *
     * @return array{invoice: Invoice, action: array}
     */
    public function checkout(User $user, int $tierId, ?int $gatewayId): array
    {
        $tier = MembershipTier::query()->active()->findOrFail($tierId);

        try {
            $gateway = $this->factory->resolve($gatewayId);
        } catch (\InvalidArgumentException $e) {
            throw ValidationException::withMessages(['gateway_id' => $e->getMessage()]);
        }

        $invoice = DB::transaction(function () use ($user, $tier, $gateway) {
            // Cancel stale unpaid invoices so a member only ever has one open checkout.
            $user->invoices()->where('status', 'pending')->update(['status' => 'cancelled', 'notes' => 'Superseded by a new checkout']);

            $invoice = Invoice::query()->create([
                'number' => $this->nextInvoiceNumber(),
                'user_id' => $user->id,
                'membership_tier_id' => $tier->id,
                'payment_gateway_id' => $gateway->id,
                'type' => $this->memberships->purchaseType($user, $tier),
                'amount' => $tier->price,
                'currency' => config('portal.currency'),
                'status' => 'pending',
            ]);

            return $invoice->load(['user', 'tier']);
        });

        try {
            $action = $this->factory->make($gateway)->initiate($invoice);
        } catch (Throwable $e) {
            $invoice->update(['status' => 'failed', 'notes' => mb_substr($e->getMessage(), 0, 250)]);
            $this->logTransaction($invoice, $gateway, 'initiate', 'failed', null, [], $e->getMessage());
            report($e);
            throw ValidationException::withMessages(['gateway_id' => 'The payment gateway could not start the payment. Please try another method or contact support.']);
        }

        $this->logTransaction($invoice, $gateway, 'initiate', 'initiated', $action->reference, [
            'type' => $action->type,
            'url' => $action->url,
            // Never persist secrets/hashes from the initiation form.
            'fields' => collect($action->fields)->except(['hash', 'secret_key', 'payment'])->all(),
        ]);

        return ['invoice' => $invoice, 'action' => $action->toArray()];
    }

    /** Server-to-server webhook / notify handler. Idempotent. */
    public function handleWebhook(PaymentGateway $gateway, Request $request, string $direction = 'webhook'): WebhookResult
    {
        $driver = $this->factory->make($gateway);
        $result = $direction === 'return' ? ($driver->handleReturn($request) ?? new WebhookResult(WebhookResult::IGNORED)) : $driver->handleWebhook($request);

        $invoice = $result->invoiceNumber ? Invoice::query()->where('number', $result->invoiceNumber)->first() : null;

        if ($invoice) {
            $this->logTransaction($invoice, $gateway, $direction, match ($result->status) {
                WebhookResult::SUCCESS => 'success',
                WebhookResult::INVALID_SIGNATURE => 'invalid_signature',
                WebhookResult::PENDING => 'pending',
                WebhookResult::IGNORED => 'pending',
                default => 'failed',
            }, $result->reference, $result->payload, $result->message, $result->amount, $request->ip());
        }

        if (! $invoice || $result->status === WebhookResult::INVALID_SIGNATURE) {
            return $result;
        }

        if ($result->isSuccess()) {
            if ($result->amount !== null && abs($result->amount - (float) $invoice->amount) > 0.01) {
                $invoice->update(['notes' => "Amount mismatch: received {$result->amount}"]);

                return new WebhookResult(WebhookResult::FAILED, $invoice->number, $result->reference, $result->amount, [], 'Amount mismatch');
            }
            $this->markPaid($invoice, $result->reference);
        } elseif ($result->status === WebhookResult::FAILED && $invoice->status === 'pending') {
            $invoice->update(['status' => 'failed']);
        }

        return $result;
    }

    /** Marks an invoice paid, activates the membership and sends the receipt SMS — exactly once. */
    public function markPaid(Invoice $invoice, ?string $reference = null, ?User $approvedBy = null): Invoice
    {
        $paidNow = false;

        $invoice = DB::transaction(function () use ($invoice, $reference, $approvedBy, &$paidNow) {
            /** @var Invoice $locked */
            $locked = Invoice::query()->whereKey($invoice->id)->lockForUpdate()->firstOrFail();
            if ($locked->isPaid()) {
                return $locked;
            }

            $locked->update(['status' => 'paid', 'paid_at' => now()]);
            $this->memberships->activateFromInvoice($locked->load(['user', 'tier']));

            if ($approvedBy) {
                $this->logTransaction($locked, $locked->gateway, 'manual', 'success', $reference, ['approved_by' => $approvedBy->id], 'Approved by '.$approvedBy->name);
                $this->audit->log('invoice.approved', "Approved payment {$locked->number} ({$locked->currency} {$locked->amount})", $locked);
            }

            $paidNow = true;

            return $locked;
        });

        if ($paidNow) {
            $invoice->load('user', 'membership', 'tier');
            $this->sms->sendEvent('payment_receipt', $invoice->user, [
                'amount' => number_format((float) $invoice->amount, 2),
                'invoice_no' => $invoice->number,
                'tier_name' => $invoice->tier->translate('name', $invoice->user->preferred_locale),
                'expiry_date' => $invoice->membership?->expires_at?->format('Y-m-d'),
            ]);

            PortalNotification::dispatchTo(
                $invoice->user,
                'Payment Approved',
                "Your payment of {$invoice->currency} {$invoice->amount} for {$invoice->tier->name} has been approved!",
                'success',
                '/member/dashboard',
                'check-circle'
            );
        }

        return $invoice->refresh();
    }

    public function uploadSlip(Invoice $invoice, UploadedFile $file): Invoice
    {
        if (! in_array($invoice->status, ['pending', 'awaiting_approval', 'failed'], true)) {
            throw ValidationException::withMessages(['slip' => 'This invoice can no longer accept a payment slip.']);
        }

        $path = $file->store("slips/{$invoice->user_id}", 'public');
        $invoice->update(['slip_path' => $path, 'status' => 'awaiting_approval']);
        $this->logTransaction($invoice, $invoice->gateway, 'manual', 'pending', $invoice->number, ['slip' => $path], 'Slip uploaded by member');

        $invoice->loadMissing('user');
        $staff = User::query()->where('is_staff', true)->get();
        PortalNotification::dispatchTo(
            $staff,
            'Payment Slip Uploaded',
            "Member {$invoice->user->name} uploaded a bank slip for invoice #{$invoice->number}.",
            'warning',
            '/admin/payments/invoices',
            'receipt'
        );

        return $invoice;
    }

    public function reject(Invoice $invoice, User $by, ?string $reason): Invoice
    {
        if ($invoice->isPaid()) {
            throw ValidationException::withMessages(['invoice' => 'Paid invoices cannot be rejected.']);
        }
        $invoice->update(['status' => 'failed', 'notes' => $reason]);
        $this->logTransaction($invoice, $invoice->gateway, 'manual', 'failed', null, ['rejected_by' => $by->id], $reason ?: 'Rejected');
        $this->audit->log('invoice.rejected', "Rejected payment {$invoice->number}", $invoice, ['reason' => $reason]);

        $invoice->loadMissing('user');
        PortalNotification::dispatchTo(
            $invoice->user,
            'Payment Slip Rejected',
            "Your payment slip for invoice #{$invoice->number} was rejected. Reason: " . ($reason ?: 'Requirements not met'),
            'error',
            '/member/invoices',
            'x-circle'
        );

        return $invoice;
    }

    public function nextInvoiceNumber(): string
    {
        $prefix = config('portal.invoice_prefix').'-'.now()->format('Y').'-';
        $last = Invoice::query()->where('number', 'like', $prefix.'%')->lockForUpdate()->orderByDesc('id')->value('number');
        $seq = $last ? ((int) substr($last, strlen($prefix))) + 1 : 1;

        return $prefix.str_pad((string) $seq, 6, '0', STR_PAD_LEFT);
    }

    private function logTransaction(Invoice $invoice, ?PaymentGateway $gateway, string $direction, string $status, ?string $reference, array $payload = [], ?string $message = null, ?float $amount = null, ?string $ip = null): PaymentTransaction
    {
        return PaymentTransaction::query()->create([
            'invoice_id' => $invoice->id,
            'payment_gateway_id' => $gateway?->id,
            'driver' => $gateway?->driver ?? 'unknown',
            'direction' => $direction,
            'reference' => $reference,
            'status' => $status,
            'amount' => $amount ?? $invoice->amount,
            'payload' => $payload,
            'ip_address' => $ip ?? request()?->ip(),
            'message' => $message ? mb_substr($message, 0, 250) : null,
        ]);
    }
}
