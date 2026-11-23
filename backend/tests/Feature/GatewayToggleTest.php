<?php

namespace Tests\Feature;

use App\Models\PaymentGateway;
use App\Models\SmsGateway;
use App\Models\User;
use Database\Seeders\GatewaySeeder;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class GatewayToggleTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RolePermissionSeeder::class);
        $this->seed(GatewaySeeder::class);

        $this->admin = User::factory()->create([
            'email' => 'admin@test.local',
            'status' => 'active',
            'is_staff' => true,
        ]);
        $this->admin->assignRole('Super Admin');
    }

    public function test_quick_toggle_unconfigured_gateways(): void
    {
        // Try toggling PayHere
        $payhere = PaymentGateway::where('driver', 'payhere')->firstOrFail();
        $payload = [
            'name' => $payhere->name,
            'mode' => $payhere->mode,
            'is_active' => true,
            'is_default' => $payhere->is_default,
            'sort_order' => $payhere->sort_order,
            'display_name' => $payhere->display_name,
        ];

        $response = $this->actingAs($this->admin)
            ->putJson("/api/admin/payment-gateways/{$payhere->id}", $payload);

        $response->assertOk();
        $response->assertJsonPath('data.is_active', true);

        // Try toggling Notify.lk
        $notifylk = SmsGateway::where('driver', 'notifylk')->firstOrFail();
        $smsPayload = [
            'name' => $notifylk->name,
            'is_active' => true,
            'is_primary' => $notifylk->is_primary,
            'is_fallback' => $notifylk->is_fallback,
            'sender_id' => $notifylk->sender_id,
            'settings' => $notifylk->settings,
        ];

        $smsResponse = $this->actingAs($this->admin)
            ->putJson("/api/admin/sms-gateways/{$notifylk->id}", $smsPayload);

        $smsResponse->assertOk();
        $smsResponse->assertJsonPath('data.is_active', true);

        // Try toggling Custom Webhook
        $custom = SmsGateway::where('driver', 'custom_http')->firstOrFail();
        $customPayload = [
            'name' => $custom->name,
            'is_active' => true,
            'is_primary' => $custom->is_primary,
            'is_fallback' => $custom->is_fallback,
            'sender_id' => $custom->sender_id,
            'settings' => $custom->settings,
        ];

        $customResponse = $this->actingAs($this->admin)
            ->putJson("/api/admin/sms-gateways/{$custom->id}", $customPayload);

        $customResponse->assertOk();
        $customResponse->assertJsonPath('data.is_active', true);
    }
}
