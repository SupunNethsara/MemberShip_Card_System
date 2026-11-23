<?php

namespace Tests\Feature;

use App\Models\Invoice;
use App\Models\MembershipTier;
use App\Models\PaymentGateway;
use App\Models\Setting;
use App\Models\User;
use Database\Seeders\GatewaySeeder;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Client\Request as HttpRequest;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class OnePayGatewayTest extends TestCase
{
    use RefreshDatabase;

    private const APP_ID = 'APP123';

    private const SALT = 'SALT-xyz';

    private const TOKEN = 'tok_abc';

    private User $member;

    private MembershipTier $tier;

    private PaymentGateway $gateway;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RolePermissionSeeder::class);
        $this->seed(GatewaySeeder::class);
        Setting::put('sms.enabled', false);

        $this->member = User::factory()->create([
            'name' => 'Anura Kumara', 'email' => 'anura@portal.test', 'phone' => '94771234567',
            'is_staff' => false, 'status' => 'active',
        ]);
        $this->member->assignRole('Member');

        $this->tier = MembershipTier::create([
            'slug' => 'gold', 'name' => ['en' => 'Gold'], 'description' => ['en' => 'x'], 'features' => [],
            'price' => 5000.00, 'duration_value' => 12, 'duration_unit' => 'months', 'color' => '#c99227',
            'priority' => 1, 'is_active' => true, 'is_featured' => false,
        ]);

        $this->gateway = PaymentGateway::where('driver', 'onepay')->firstOrFail();
        $this->gateway->fillCredentials(['app_id' => self::APP_ID, 'app_token' => self::TOKEN, 'hash_salt' => self::SALT]);
        $this->gateway->update(['is_active' => true]);
    }

    public function test_onepay_is_the_default_gateway(): void
    {
        $this->assertTrue($this->gateway->is_default);
        $this->assertSame(1, PaymentGateway::where('is_default', true)->count());
        $this->getJson('/api/public/gateways')->assertOk()->assertJsonPath('data.0.id', $this->gateway->id);
    }

    public function test_checkout_creates_signed_onepay_link_and_redirects(): void
    {
        Http::fake(['api.onepay.lk/*' => Http::response(['status' => 200, 'data' => ['gateway' => ['redirect_url' => 'https://gateway.onepay.lk/pay/abc']]])]);

        $this->actingAs($this->member)->postJson('/api/member/checkout', ['tier_id' => $this->tier->id, 'gateway_id' => $this->gateway->id])
            ->assertCreated()
            ->assertJsonPath('action.type', 'redirect')
            ->assertJsonPath('action.url', 'https://gateway.onepay.lk/pay/abc');

        $invoice = Invoice::where('user_id', $this->member->id)->latest('id')->firstOrFail();

        Http::assertSent(function (HttpRequest $r) use ($invoice) {
            return $r->url() === 'https://api.onepay.lk/v3/checkout/link/'
                && $r->hasHeader('Authorization', self::TOKEN)
                && $r['reference'] === $invoice->number
                && $r['amount'] === '5000.00'
                && $r['hash'] === hash('sha256', self::APP_ID.'LKR'.'5000.00'.self::SALT);
        });
    }

    public function test_checkout_fails_gracefully_when_onepay_rejects(): void
    {
        Http::fake(['api.onepay.lk/*' => Http::response(['message' => 'Invalid hash'], 400)]);

        $this->actingAs($this->member)->postJson('/api/member/checkout', ['tier_id' => $this->tier->id, 'gateway_id' => $this->gateway->id])
            ->assertStatus(422)->assertJsonValidationErrors('gateway_id');

        $this->assertSame('failed', Invoice::where('user_id', $this->member->id)->latest('id')->value('status'));
    }

    public function test_valid_callback_marks_invoice_paid_once(): void
    {
        $invoice = $this->pendingInvoice();
        $body = $this->onepayCallback($invoice->number, 'OP-TXN-1', 1, '5000.00');

        $this->postJson($this->gateway->webhookUrl(), $body)->assertOk()->assertJson(['status' => 'success']);
        $this->assertSame('paid', $invoice->refresh()->status);
        $this->assertNotNull($this->member->refresh()->activeMembership);

        // Replay is harmless.
        $this->postJson($this->gateway->webhookUrl(), $body)->assertOk();
        $this->assertSame('paid', $invoice->refresh()->status);
    }

    public function test_forged_callback_is_rejected(): void
    {
        $invoice = $this->pendingInvoice();
        $body = $this->onepayCallback($invoice->number, 'OP-TXN-2', 1, '5000.00', 'wrong-salt');

        $this->postJson($this->gateway->webhookUrl(), $body)->assertStatus(400);
        $this->assertSame('pending', $invoice->refresh()->status);
    }

    public function test_tampered_amount_is_rejected(): void
    {
        $invoice = $this->pendingInvoice();
        $body = $this->onepayCallback($invoice->number, 'OP-TXN-3', 1, '5000.00');
        $body['paid_amount'] = '10.00';

        $this->postJson($this->gateway->webhookUrl(), $body)->assertStatus(400);
        $this->assertSame('pending', $invoice->refresh()->status);
    }

    public function test_underpaid_signed_callback_does_not_activate(): void
    {
        $invoice = $this->pendingInvoice();

        $this->postJson($this->gateway->webhookUrl(), $this->onepayCallback($invoice->number, 'OP-TXN-4', 1, '10.00'))->assertOk();
        $this->assertNotSame('paid', $invoice->refresh()->status);
    }

    public function test_failed_status_marks_invoice_failed(): void
    {
        $invoice = $this->pendingInvoice();

        $this->postJson($this->gateway->webhookUrl(), $this->onepayCallback($invoice->number, 'OP-TXN-5', 0, '5000.00'))->assertOk();
        $this->assertSame('failed', $invoice->refresh()->status);
    }

    private function pendingInvoice(): Invoice
    {
        return Invoice::create([
            'number' => 'INV-2026-000777', 'user_id' => $this->member->id, 'membership_tier_id' => $this->tier->id,
            'payment_gateway_id' => $this->gateway->id, 'type' => 'new', 'amount' => 5000.00, 'currency' => 'LKR', 'status' => 'pending',
        ]);
    }

    private function onepayCallback(string $invoiceNo, string $txn, int $status, string $amount, string $salt = self::SALT): array
    {
        $hash = hash('sha256', json_encode([
            'onepay_transaction_id' => $txn,
            'merchant_transaction_id' => $invoiceNo,
            'app_id' => self::APP_ID,
            'hash_salt' => $salt,
            'net_amount' => $amount,
            'status' => $status,
        ]));

        return ['merchant_transaction_id' => $invoiceNo, 'onepay_transaction_id' => $txn, 'status' => $status, 'paid_amount' => $amount, 'hash' => $hash];
    }
}
