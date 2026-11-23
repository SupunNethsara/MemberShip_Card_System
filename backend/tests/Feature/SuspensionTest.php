<?php

namespace Tests\Feature;

use App\Models\AuditLog;
use App\Models\Setting;
use App\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class SuspensionTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;
    private User $member;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RolePermissionSeeder::class);
        Setting::put('site.name', 'Jeewanasaviya Test');

        $this->admin = User::factory()->create([
            'name' => 'Admin User',
            'email' => 'admin@example.com',
            'is_staff' => true,
            'status' => 'active',
        ]);
        $this->admin->assignRole('Super Admin');

        $this->member = User::factory()->create([
            'name' => 'Sunil Silva',
            'email' => 'sunil@example.com',
            'phone' => '94771239999',
            'password' => Hash::make('MemberSecret123'),
            'is_staff' => false,
            'status' => 'active',
        ]);
        $this->member->assignRole('Member');
    }

    public function test_admin_can_suspend_member_with_reason(): void
    {
        // Issue token to member before suspension
        $memberToken = $this->member->createToken('portal')->plainTextToken;
        $this->assertDatabaseHas('personal_access_tokens', [
            'tokenable_id' => $this->member->id,
            'tokenable_type' => User::class,
        ]);

        $adminToken = $this->admin->createToken('admin')->plainTextToken;

        $response = $this->withHeader('Authorization', "Bearer {$adminToken}")
            ->putJson("/api/admin/members/{$this->member->id}", [
                'name' => $this->member->name,
                'email' => $this->member->email,
                'status' => 'suspended',
                'suspension_reason' => 'Suspected account compromise and unusual activity',
            ]);

        $response->assertStatus(200);

        // Verify member status and suspension reason in database
        $this->member->refresh();
        $this->assertEquals('suspended', $this->member->status);
        $this->assertEquals('Suspected account compromise and unusual activity', $this->member->suspension_reason);

        // Verify all existing tokens were revoked
        $this->assertDatabaseMissing('personal_access_tokens', [
            'tokenable_id' => $this->member->id,
            'tokenable_type' => User::class,
        ]);

        // Verify audit log
        $this->assertDatabaseHas('audit_logs', [
            'action' => 'member.status',
            'auditable_type' => 'User',
            'auditable_id' => $this->member->id,
        ]);
    }

    public function test_suspended_user_cannot_perform_api_actions(): void
    {
        // First issue a token to member, then suspend the member
        $plainToken = $this->member->createToken('portal')->plainTextToken;

        $this->member->update([
            'status' => 'suspended',
            'suspension_reason' => 'Term breach',
        ]);

        // Access member area
        $response = $this->withHeader('Authorization', "Bearer {$plainToken}")
            ->getJson('/api/member/dashboard');

        // EnsureActiveAccount middleware blocks suspended users with 401
        $response->assertStatus(401);

        // Access notifications
        $notificationResponse = $this->withHeader('Authorization', "Bearer {$plainToken}")
            ->getJson('/api/notifications');

        $notificationResponse->assertStatus(401);
    }

    public function test_suspended_user_cannot_login(): void
    {
        $this->member->update([
            'status' => 'suspended',
            'suspension_reason' => 'Payment default',
        ]);

        $response = $this->postJson('/api/auth/login', [
            'email' => $this->member->email,
            'password' => 'MemberSecret123',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['email']);

        $this->assertStringContainsString('Payment default', $response->json('errors.email.0'));
    }

    public function test_suspended_user_cannot_request_password_reset(): void
    {
        $this->member->update([
            'status' => 'suspended',
            'suspension_reason' => 'Security hold',
        ]);

        $response = $this->postJson('/api/auth/forgot-password/send-otp', [
            'identifier' => $this->member->email,
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['identifier']);

        $this->assertStringContainsString('Security hold', $response->json('errors.identifier.0'));
    }

    public function test_reactivation_clears_suspension_reason_and_restores_access(): void
    {
        // Suspend first
        $this->member->update([
            'status' => 'suspended',
            'suspension_reason' => 'Under investigation',
        ]);

        $adminToken = $this->admin->createToken('admin')->plainTextToken;

        // Admin reactivates
        $response = $this->withHeader('Authorization', "Bearer {$adminToken}")
            ->putJson("/api/admin/members/{$this->member->id}", [
                'name' => $this->member->name,
                'email' => $this->member->email,
                'status' => 'active',
            ]);

        $response->assertStatus(200);

        // Verify database: status is active and suspension_reason is CLEARED to null
        $this->member->refresh();
        $this->assertEquals('active', $this->member->status);
        $this->assertNull($this->member->suspension_reason);

        // Verify member can login again
        $loginResponse = $this->postJson('/api/auth/login', [
            'email' => $this->member->email,
            'password' => 'MemberSecret123',
        ]);

        $loginResponse->assertStatus(200)
            ->assertJsonStructure(['token', 'user']);

        $newToken = $loginResponse->json('token');

        // Verify member can access member dashboard
        $dashResponse = $this->withHeader('Authorization', "Bearer {$newToken}")
            ->getJson('/api/member/dashboard');

        $dashResponse->assertStatus(200);
    }
}
