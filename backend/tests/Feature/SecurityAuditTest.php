<?php

namespace Tests\Feature;

use App\Models\Invoice;
use App\Models\MembershipTier;
use App\Models\PaymentGateway;
use App\Models\Setting;
use App\Models\SmsGateway;
use App\Models\SmsLog;
use App\Models\User;
use App\Services\Sms\SmsService;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Crypt;
use Tests\TestCase;

class SecurityAuditTest extends TestCase
{
    use RefreshDatabase;

    private User $memberA;
    private User $memberB;
    private User $staff;
    private User $admin;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RolePermissionSeeder::class);
        Setting::put('site.name', 'Security Test Portal');

        $this->memberA = User::factory()->create([
            'name' => 'Alice Member',
            'email' => 'alice@test.local',
            'phone' => '94771111111',
            'status' => 'active',
            'is_staff' => false,
            'card_token' => 'secure-alice-card-token-12345',
        ]);
        $this->memberA->assignRole('Member');

        $this->memberB = User::factory()->create([
            'name' => 'Bob Member',
            'email' => 'bob@test.local',
            'phone' => '94772222222',
            'status' => 'active',
            'is_staff' => false,
            'card_token' => 'secure-bob-card-token-67890',
        ]);
        $this->memberB->assignRole('Member');

        $this->staff = User::factory()->create([
            'name' => 'Staff Agent',
            'email' => 'staff@test.local',
            'phone' => '94773333333',
            'status' => 'active',
            'is_staff' => true,
        ]);
        $this->staff->assignRole('Operations Manager');

        $this->admin = User::factory()->create([
            'name' => 'Super Admin',
            'email' => 'admin@test.local',
            'phone' => '94774444444',
            'status' => 'active',
            'is_staff' => true,
        ]);
        $this->admin->assignRole('Super Admin');
    }

    public function test_plain_otp_is_redacted_in_sms_logs(): void
    {
        // Configure log driver for SMS
        $gateway = SmsGateway::query()->create([
            'driver' => 'log',
            'name' => 'Test Log Driver',
            'is_active' => true,
            'is_primary' => true,
        ]);

        /** @var SmsService $sms */
        $sms = app(SmsService::class);
        $sms->send('94771111111', 'Your verification code is 849201. It expires in 5 minutes.', 'otp', $this->memberA, $gateway);

        $log = SmsLog::query()->where('recipient', '94771111111')->where('event', 'otp')->first();
        $this->assertNotNull($log);

        // Sensitive 6-digit OTP code must NEVER be stored in plaintext in the log table
        $this->assertStringNotContainsString('849201', $log->message);
        $this->assertStringContainsString('******', $log->message);
    }

    public function test_staff_suspension_revokes_all_staff_tokens(): void
    {
        $token1 = $this->staff->createToken('workstation')->plainTextToken;
        $token2 = $this->staff->createToken('mobile')->plainTextToken;

        $this->assertCount(2, $this->staff->tokens);

        /** @var \App\Services\UserService $userService */
        $userService = app(\App\Services\UserService::class);
        $userService->saveStaff($this->staff, [
            'name' => $this->staff->name,
            'email' => $this->staff->email,
            'status' => 'suspended',
            'suspension_reason' => 'Security review',
        ]);

        $this->staff->refresh();
        $this->assertEquals('suspended', $this->staff->status);
        $this->assertCount(0, $this->staff->tokens);
    }

    public function test_suspended_account_tokens_fully_revoked_on_access(): void
    {
        $token1 = $this->memberA->createToken('device-1')->plainTextToken;
        $token2 = $this->memberA->createToken('device-2')->plainTextToken;
        $this->assertCount(2, $this->memberA->tokens);

        $this->memberA->update(['status' => 'suspended']);

        // Making request with token 1 must abort with 401 and revoke ALL tokens
        $response = $this->withHeader('Authorization', "Bearer {$token1}")
            ->getJson('/api/member/dashboard');

        $response->assertStatus(401);

        $this->memberA->refresh();
        $this->assertCount(0, $this->memberA->tokens);

        // Second token must also now be rejected
        $secondResponse = $this->withHeader('Authorization', "Bearer {$token2}")
            ->getJson('/api/member/dashboard');
        $secondResponse->assertStatus(401);
    }

    public function test_sanctum_expiration_configured(): void
    {
        $expiration = config('sanctum.expiration');
        $this->assertNotNull($expiration, 'Sanctum expiration must not be null');
        $this->assertGreaterThan(0, $expiration);
    }

    public function test_otp_ttl_is_five_minutes(): void
    {
        $response = $this->postJson('/api/auth/register/send-otp', [
            'name' => 'Charlie User',
            'email' => 'charlie@test.local',
            'phone' => '0779998877',
            'password' => 'Password123!',
            'password_confirmation' => 'Password123!',
        ]);

        $response->assertStatus(200);
        $this->assertEquals(300, $response->json('expires_in'));
    }

    public function test_cors_configuration_restricts_origins(): void
    {
        $origins = config('cors.allowed_origins');
        $this->assertNotContains('*', $origins, 'CORS allowed_origins must not contain wildcard *');
        $this->assertTrue(config('cors.supports_credentials'));
    }

    public function test_public_storage_htaccess_prevents_script_execution(): void
    {
        $htaccessPath = storage_path('app/public/.htaccess');
        $this->assertFileExists($htaccessPath);

        $content = file_get_contents($htaccessPath);
        $this->assertStringContainsString('php_flag engine off', $content);
        $this->assertStringContainsString('Deny from all', $content);
    }

    public function test_payment_gateway_credentials_encrypted_and_masked_in_api(): void
    {
        $gateway = PaymentGateway::query()->create([
            'driver' => 'stripe',
            'name' => 'Stripe Production',
            'mode' => 'live',
            'is_active' => true,
        ]);

        $gateway->fillCredentials([
            'publishable_key' => 'pk_live_1234567890123456',
            'secret_key' => 'sk_live_9876543210987654',
            'webhook_secret' => 'whsec_abcdef1234567890',
        ])->save();

        // 1. Raw database value must be encrypted with AES-256 via Crypt
        $rawCredentials = $gateway->getAttributes()['credentials'];
        $this->assertStringNotContainsString('sk_live_', $rawCredentials);
        $this->assertNotEmpty(Crypt::decryptString($rawCredentials));

        // 2. Admin API endpoint returns credentials masked with bullet characters
        $adminToken = $this->admin->createToken('admin')->plainTextToken;
        $response = $this->withHeader('Authorization', "Bearer {$adminToken}")
            ->getJson('/api/admin/payment-gateways');

        $response->assertStatus(200);
        $body = $response->getContent();

        $this->assertStringNotContainsString('sk_live_9876543210987654', $body);
        $creds = collect($response->json('data'))->firstWhere('id', $gateway->id)['credentials'];
        $this->assertStringContainsString('••••••••••••', $creds['secret_key']);

        // 3. Public gateway endpoint never exposes credentials property at all
        $pubResponse = $this->getJson('/api/public/gateways');
        $pubResponse->assertStatus(200);
        $this->assertStringNotContainsString('credentials', $pubResponse->getContent());
        $this->assertStringNotContainsString('secret_key', $pubResponse->getContent());
    }

    public function test_member_cannot_access_another_members_invoice_or_receipt_idor(): void
    {
        $tier = MembershipTier::query()->create([
            'slug' => 'test-tier',
            'name' => ['en' => 'Test Tier'],
            'price' => 2500,
            'duration_value' => 1,
            'duration_unit' => 'months',
        ]);

        $aliceInvoice = Invoice::query()->create([
            'number' => 'INV-2026-999901',
            'user_id' => $this->memberA->id,
            'membership_tier_id' => $tier->id,
            'amount' => 2500,
            'currency' => 'LKR',
            'status' => 'paid',
            'paid_at' => now(),
        ]);

        $bobToken = $this->memberB->createToken('portal')->plainTextToken;

        // Bob tries to view Alice's invoice (IDOR attempt)
        $viewResponse = $this->withHeader('Authorization', "Bearer {$bobToken}")
            ->getJson("/api/member/invoices/{$aliceInvoice->id}");

        $viewResponse->assertStatus(403);

        // Bob tries to download Alice's receipt (IDOR attempt)
        $receiptResponse = $this->withHeader('Authorization', "Bearer {$bobToken}")
            ->getJson("/api/member/invoices/{$aliceInvoice->id}/receipt");

        $receiptResponse->assertStatus(403);
    }

    public function test_regular_member_forbidden_from_admin_endpoints(): void
    {
        $memberToken = $this->memberA->createToken('portal')->plainTextToken;

        // Attempting to access admin member listing
        $response = $this->withHeader('Authorization', "Bearer {$memberToken}")
            ->getJson('/api/admin/members');

        $response->assertStatus(403);

        // Attempting to access admin dashboard
        $dashResponse = $this->withHeader('Authorization', "Bearer {$memberToken}")
            ->getJson('/api/admin/dashboard');

        $dashResponse->assertStatus(403);

        // Attempting to access gateway credentials
        $gwResponse = $this->withHeader('Authorization', "Bearer {$memberToken}")
            ->getJson('/api/admin/payment-gateways');

        $gwResponse->assertStatus(403);
    }
}
