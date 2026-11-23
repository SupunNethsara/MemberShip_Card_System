<?php

namespace Tests\Feature;

use App\Models\Invoice;
use App\Models\MemberCard;
use App\Models\MembershipTier;
use App\Models\PaymentGateway;
use App\Models\Setting;
use App\Models\User;
use Database\Seeders\GatewaySeeder;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class MembershipSubscriptionTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;
    private User $member;
    private MembershipTier $tier;
    private PaymentGateway $manualGateway;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RolePermissionSeeder::class);
        $this->seed(GatewaySeeder::class);

        Setting::put('site.name', 'Jeewanasaviya Test');
        Setting::put('sms.enabled', false);

        $this->admin = User::factory()->create([
            'name' => 'Super Admin',
            'email' => 'admin@portal.test',
            'is_staff' => true,
            'status' => 'active',
        ]);
        $this->admin->assignRole('Super Admin');

        $this->member = User::factory()->create([
            'name' => 'Anura Kumara',
            'email' => 'anura@portal.test',
            'phone' => '94771234567',
            'is_staff' => false,
            'status' => 'active',
        ]);
        $this->member->assignRole('Member');

        $this->tier = MembershipTier::create([
            'slug' => 'gold-tier',
            'name' => ['en' => 'Gold Plan', 'si' => 'රන් සැලසුම'],
            'description' => ['en' => 'All perks included'],
            'features' => [['en' => 'Discount at 50+ stores']],
            'price' => 5000.00,
            'duration_value' => 12,
            'duration_unit' => 'months',
            'color' => '#c99227',
            'priority' => 1,
            'is_active' => true,
            'is_featured' => true,
        ]);

        $this->manualGateway = PaymentGateway::where('driver', 'manual')->firstOrFail();
    }

    public function test_public_tiers_listing_returns_active_tiers(): void
    {
        $response = $this->getJson('/api/public/tiers');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    '*' => ['id', 'slug', 'name', 'price', 'duration_value', 'duration_unit'],
                ],
            ]);

        $this->assertNotEmpty($response->json('data'));
    }

    public function test_member_can_initiate_checkout(): void
    {
        $token = $this->member->createToken('portal')->plainTextToken;

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/member/checkout', [
                'tier_id' => $this->tier->id,
                'gateway_id' => $this->manualGateway->id,
            ]);

        $response->assertStatus(201)
            ->assertJsonStructure([
                'invoice' => ['id', 'number', 'amount', 'currency', 'status'],
                'action',
            ])
            ->assertJson([
                'invoice' => [
                    'amount' => 5000,
                    'status' => 'pending',
                ],
                'action' => [
                    'type' => 'manual',
                ],
            ]);

        $this->assertDatabaseHas('invoices', [
            'user_id' => $this->member->id,
            'membership_tier_id' => $this->tier->id,
            'status' => 'pending',
            'amount' => 5000.00,
        ]);
    }

    public function test_slip_upload_validation_rejects_invalid_file_types_and_sizes(): void
    {
        Storage::fake('public');
        $token = $this->member->createToken('portal')->plainTextToken;

        $invoice = Invoice::create([
            'number' => 'INV-2026-000001',
            'user_id' => $this->member->id,
            'membership_tier_id' => $this->tier->id,
            'payment_gateway_id' => $this->manualGateway->id,
            'type' => 'new',
            'amount' => 5000.00,
            'currency' => 'LKR',
            'status' => 'pending',
        ]);

        // Test invalid file extension / mime
        $invalidFile = UploadedFile::fake()->create('malware.txt', 100, 'text/plain');
        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson("/api/member/invoices/{$invoice->id}/slip", [
                'slip' => $invalidFile,
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['slip']);

        // Test oversized file (> 5MB = 5120KB)
        $oversizedFile = UploadedFile::fake()->create('huge_slip.jpg', 6000, 'image/jpeg');
        $responseOversized = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson("/api/member/invoices/{$invoice->id}/slip", [
                'slip' => $oversizedFile,
            ]);

        $responseOversized->assertStatus(422)
            ->assertJsonValidationErrors(['slip']);
    }

    public function test_slip_upload_succeeds_for_pending_invoice_and_dispatches_notification(): void
    {
        Storage::fake('public');
        $token = $this->member->createToken('portal')->plainTextToken;

        $invoice = Invoice::create([
            'number' => 'INV-2026-000002',
            'user_id' => $this->member->id,
            'membership_tier_id' => $this->tier->id,
            'payment_gateway_id' => $this->manualGateway->id,
            'type' => 'new',
            'amount' => 5000.00,
            'currency' => 'LKR',
            'status' => 'pending',
        ]);

        $validSlip = UploadedFile::fake()->image('receipt.jpg', 800, 600);

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson("/api/member/invoices/{$invoice->id}/slip", [
                'slip' => $validSlip,
            ]);

        $response->assertStatus(200);

        $invoice->refresh();
        $this->assertEquals('awaiting_approval', $invoice->status);
        $this->assertNotNull($invoice->slip_path);
        Storage::disk('public')->assertExists($invoice->slip_path);

        // Verify staff received notification
        $this->assertDatabaseHas('notifications', [
            'notifiable_id' => $this->admin->id,
            'notifiable_type' => User::class,
        ]);
    }

    public function test_slip_upload_rejected_on_paid_invoice(): void
    {
        Storage::fake('public');
        $token = $this->member->createToken('portal')->plainTextToken;

        $invoice = Invoice::create([
            'number' => 'INV-2026-000003',
            'user_id' => $this->member->id,
            'membership_tier_id' => $this->tier->id,
            'payment_gateway_id' => $this->manualGateway->id,
            'type' => 'new',
            'amount' => 5000.00,
            'currency' => 'LKR',
            'status' => 'paid',
            'paid_at' => now(),
        ]);

        $validSlip = UploadedFile::fake()->image('receipt.jpg');

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson("/api/member/invoices/{$invoice->id}/slip", [
                'slip' => $validSlip,
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['slip']);
    }

    public function test_unauthorized_member_cannot_upload_slip_for_another_member(): void
    {
        Storage::fake('public');
        $otherMember = User::factory()->create([
            'name' => 'Other Member',
            'email' => 'other@portal.test',
            'status' => 'active',
        ]);
        $otherMember->assignRole('Member');
        $otherToken = $otherMember->createToken('portal')->plainTextToken;

        $invoice = Invoice::create([
            'number' => 'INV-2026-000004',
            'user_id' => $this->member->id,
            'membership_tier_id' => $this->tier->id,
            'payment_gateway_id' => $this->manualGateway->id,
            'type' => 'new',
            'amount' => 5000.00,
            'currency' => 'LKR',
            'status' => 'pending',
        ]);

        $validSlip = UploadedFile::fake()->image('receipt.jpg');

        $response = $this->withHeader('Authorization', "Bearer {$otherToken}")
            ->postJson("/api/member/invoices/{$invoice->id}/slip", [
                'slip' => $validSlip,
            ]);

        $response->assertStatus(403);
    }

    public function test_admin_invoice_approval_flow(): void
    {
        $adminToken = $this->admin->createToken('admin')->plainTextToken;

        $invoice = Invoice::create([
            'number' => 'INV-2026-000005',
            'user_id' => $this->member->id,
            'membership_tier_id' => $this->tier->id,
            'payment_gateway_id' => $this->manualGateway->id,
            'type' => 'new',
            'amount' => 5000.00,
            'currency' => 'LKR',
            'status' => 'awaiting_approval',
        ]);

        $response = $this->withHeader('Authorization', "Bearer {$adminToken}")
            ->postJson("/api/admin/invoices/{$invoice->id}/approve", [
                'reference' => 'TXN-BANK-123456',
            ]);

        $response->assertStatus(200);

        // Verify invoice is paid
        $invoice->refresh();
        $this->assertEquals('paid', $invoice->status);
        $this->assertNotNull($invoice->paid_at);

        // Verify membership was activated
        $this->assertDatabaseHas('memberships', [
            'user_id' => $this->member->id,
            'membership_tier_id' => $this->tier->id,
            'status' => 'active',
        ]);

        // Verify member received notification
        $this->assertDatabaseHas('notifications', [
            'notifiable_id' => $this->member->id,
            'notifiable_type' => User::class,
        ]);

        // Attempting to re-approve already paid invoice must return 422
        $reApproveResponse = $this->withHeader('Authorization', "Bearer {$adminToken}")
            ->postJson("/api/admin/invoices/{$invoice->id}/approve");

        $reApproveResponse->assertStatus(422);
    }

    public function test_admin_invoice_rejection_flow(): void
    {
        $adminToken = $this->admin->createToken('admin')->plainTextToken;

        $invoice = Invoice::create([
            'number' => 'INV-2026-000006',
            'user_id' => $this->member->id,
            'membership_tier_id' => $this->tier->id,
            'payment_gateway_id' => $this->manualGateway->id,
            'type' => 'new',
            'amount' => 5000.00,
            'currency' => 'LKR',
            'status' => 'awaiting_approval',
        ]);

        // Rejection without reason fails validation
        $failResponse = $this->withHeader('Authorization', "Bearer {$adminToken}")
            ->postJson("/api/admin/invoices/{$invoice->id}/reject", []);

        $failResponse->assertStatus(422)
            ->assertJsonValidationErrors(['reason']);

        // Reject with reason
        $response = $this->withHeader('Authorization', "Bearer {$adminToken}")
            ->postJson("/api/admin/invoices/{$invoice->id}/reject", [
                'reason' => 'Deposit slip is unreadable, please re-upload clear photo',
            ]);

        $response->assertStatus(200);

        $invoice->refresh();
        $this->assertEquals('failed', $invoice->status);
        $this->assertEquals('Deposit slip is unreadable, please re-upload clear photo', $invoice->notes);

        // Verify member received rejection notification
        $this->assertDatabaseHas('notifications', [
            'notifiable_id' => $this->member->id,
            'notifiable_type' => User::class,
        ]);
    }

    public function test_physical_card_lifecycle(): void
    {
        $adminToken = $this->admin->createToken('admin')->plainTextToken;

        // Ensure member identity (member_code, card_token)
        app(\App\Services\MembershipService::class)->ensureMemberIdentity($this->member);

        // Activate membership directly
        $this->member->memberships()->create([
            'membership_tier_id' => $this->tier->id,
            'status' => 'active',
            'starts_at' => now(),
            'expires_at' => now()->addYear(),
            'source' => 'payment',
        ]);

        // 1. Initial status: pending
        $card = MemberCard::create([
            'user_id' => $this->member->id,
            'card_status' => MemberCard::PENDING,
            'pending_reason' => 'new',
        ]);

        // 2. Marking issued directly while still pending must fail
        $invalidIssueResponse = $this->withHeader('Authorization', "Bearer {$adminToken}")
            ->postJson('/api/admin/cards/mark-issued', [
                'user_ids' => [$this->member->id],
            ]);

        $invalidIssueResponse->assertStatus(422)
            ->assertJsonValidationErrors(['user_ids']);

        // 3. Mark card as printed
        $printResponse = $this->withHeader('Authorization', "Bearer {$adminToken}")
            ->postJson('/api/admin/cards/mark-printed', [
                'user_ids' => [$this->member->id],
            ]);

        $printResponse->assertStatus(200)
            ->assertJson(['message' => 'Cards marked as printed']);

        $card->refresh();
        $this->assertEquals(MemberCard::PRINTED, $card->card_status);
        $this->assertNotNull($card->card_printed_at);
        $this->assertEquals($this->admin->id, $card->card_printed_by);

        // 4. Mark card as issued
        $issueResponse = $this->withHeader('Authorization', "Bearer {$adminToken}")
            ->postJson('/api/admin/cards/mark-issued', [
                'user_ids' => [$this->member->id],
                'note' => 'Card handed over at main branch',
            ]);

        $issueResponse->assertStatus(200);

        $card->refresh();
        $this->assertEquals(MemberCard::ISSUED, $card->card_status);
        $this->assertNotNull($card->issued_at);
        $this->assertEquals($this->admin->id, $card->issued_by);

        // Verify member received card issued notification
        $this->assertDatabaseHas('notifications', [
            'notifiable_id' => $this->member->id,
            'notifiable_type' => User::class,
        ]);
    }
}
