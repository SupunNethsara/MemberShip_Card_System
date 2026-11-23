<?php

namespace Tests\Feature;

use App\Models\Setting;
use App\Models\User;
use App\Notifications\PortalNotification;
use Database\Seeders\RolePermissionSeeder;
use Exception;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class NotificationTest extends TestCase
{
    use RefreshDatabase;

    private User $memberA;
    private User $memberB;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RolePermissionSeeder::class);
        Setting::put('site.name', 'Jeewanasaviya Test');

        $this->memberA = User::factory()->create([
            'name' => 'Member Alpha',
            'email' => 'alpha@portal.test',
            'status' => 'active',
        ]);
        $this->memberA->assignRole('Member');

        $this->memberB = User::factory()->create([
            'name' => 'Member Beta',
            'email' => 'beta@portal.test',
            'status' => 'active',
        ]);
        $this->memberB->assignRole('Member');
    }

    public function test_notifications_table_schema_and_columns(): void
    {
        $this->assertTrue(Schema::hasTable('notifications'));

        $columns = [
            'id',
            'type',
            'notifiable_type',
            'notifiable_id',
            'data',
            'read_at',
            'created_at',
            'updated_at',
        ];

        foreach ($columns as $column) {
            $this->assertTrue(Schema::hasColumn('notifications', $column), "Column [{$column}] missing from notifications table.");
        }
    }

    public function test_portal_notification_dispatch_to_persists_in_database(): void
    {
        PortalNotification::dispatchTo(
            $this->memberA,
            'Welcome Bonus',
            'You received 500 bonus points!',
            'success',
            '/member/benefits',
            'gift'
        );

        $this->assertDatabaseHas('notifications', [
            'notifiable_id' => $this->memberA->id,
            'notifiable_type' => User::class,
        ]);

        $notification = $this->memberA->notifications()->first();
        $this->assertNotNull($notification);
        $this->assertEquals('Welcome Bonus', $notification->data['title']);
        $this->assertEquals('You received 500 bonus points!', $notification->data['message']);
        $this->assertEquals('success', $notification->data['type']);
        $this->assertEquals('/member/benefits', $notification->data['link']);
        $this->assertEquals('gift', $notification->data['icon']);
        $this->assertNull($notification->read_at);
    }

    public function test_get_notifications_endpoint_returns_list_and_unread_count(): void
    {
        PortalNotification::dispatchTo($this->memberA, 'Notification 1', 'Message 1');
        PortalNotification::dispatchTo($this->memberA, 'Notification 2', 'Message 2');

        $token = $this->memberA->createToken('portal')->plainTextToken;

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson('/api/notifications');

        $response->assertStatus(200)
            ->assertJson([
                'unread_count' => 2,
            ])
            ->assertJsonStructure([
                'unread_count',
                'notifications' => [
                    '*' => ['id', 'type', 'title', 'message', 'link', 'icon', 'read_at', 'created_at'],
                ],
            ]);

        $this->assertCount(2, $response->json('notifications'));
    }

    public function test_mark_single_notification_as_read(): void
    {
        PortalNotification::dispatchTo($this->memberA, 'First Alert', 'Details 1');
        PortalNotification::dispatchTo($this->memberA, 'Second Alert', 'Details 2');

        $notification = $this->memberA->notifications()->first();
        $token = $this->memberA->createToken('portal')->plainTextToken;

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson("/api/notifications/{$notification->id}/read");

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'unread_count' => 1,
            ]);

        $notification->refresh();
        $this->assertNotNull($notification->read_at);
    }

    public function test_mark_all_notifications_as_read(): void
    {
        PortalNotification::dispatchTo($this->memberA, 'First Alert', 'Details 1');
        PortalNotification::dispatchTo($this->memberA, 'Second Alert', 'Details 2');
        PortalNotification::dispatchTo($this->memberA, 'Third Alert', 'Details 3');

        $token = $this->memberA->createToken('portal')->plainTextToken;

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/notifications/read-all');

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'unread_count' => 0,
            ]);

        $this->assertEquals(0, $this->memberA->unreadNotifications()->count());
    }

    public function test_delete_notification(): void
    {
        PortalNotification::dispatchTo($this->memberA, 'Notice to delete', 'Details');
        $notification = $this->memberA->notifications()->first();

        $token = $this->memberA->createToken('portal')->plainTextToken;

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->deleteJson("/api/notifications/{$notification->id}");

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'unread_count' => 0,
            ]);

        $this->assertDatabaseMissing('notifications', [
            'id' => $notification->id,
        ]);
    }

    public function test_user_cannot_access_or_modify_another_users_notifications(): void
    {
        PortalNotification::dispatchTo($this->memberB, 'Private to Beta', 'Confidential details');
        $betaNotification = $this->memberB->notifications()->first();

        $alphaToken = $this->memberA->createToken('portal')->plainTextToken;

        // Member A tries to mark Member B's notification as read
        $readResponse = $this->withHeader('Authorization', "Bearer {$alphaToken}")
            ->postJson("/api/notifications/{$betaNotification->id}/read");

        $readResponse->assertStatus(200);
        // Should NOT mark it read because it doesn't belong to Member A
        $betaNotification->refresh();
        $this->assertNull($betaNotification->read_at);

        // Member A tries to delete Member B's notification
        $deleteResponse = $this->withHeader('Authorization', "Bearer {$alphaToken}")
            ->deleteJson("/api/notifications/{$betaNotification->id}");

        $deleteResponse->assertStatus(200);
        // Should NOT delete Member B's notification
        $this->assertDatabaseHas('notifications', [
            'id' => $betaNotification->id,
        ]);
    }

    public function test_unauthenticated_request_is_blocked(): void
    {
        $response = $this->getJson('/api/notifications');
        $response->assertStatus(401);
    }

    public function test_graceful_fallback_when_broadcasting_fails(): void
    {
        // Mock Notification facade to throw exception on first broadcast attempt,
        // simulating Reverb socket offline or unreachable broadcast driver
        $initialSend = true;

        Notification::shouldReceive('send')
            ->andReturnUsing(function ($notifiables, $notification) use (&$initialSend) {
                if ($initialSend) {
                    $initialSend = false;
                    throw new Exception('Reverb WebSocket connection refused');
                }
                // Fallback: database delivery executes standard notification handling
                foreach ((is_iterable($notifiables) ? $notifiables : [$notifiables]) as $notifiable) {
                    $notifiable->notifications()->create([
                        'id' => (string) \Illuminate\Support\Str::uuid(),
                        'type' => get_class($notification),
                        'data' => $notification->toDatabase($notifiable),
                        'read_at' => null,
                    ]);
                }
            });

        // Dispatch should not crash or throw unhandled exception
        PortalNotification::dispatchTo(
            $this->memberA,
            'Fallback Test',
            'Broadcasting failed but notification persisted',
            'warning'
        );

        $this->assertDatabaseHas('notifications', [
            'notifiable_id' => $this->memberA->id,
            'notifiable_type' => User::class,
        ]);

        $notification = $this->memberA->notifications()->first();
        $this->assertNotNull($notification);
        $this->assertEquals('Fallback Test', $notification->data['title']);
    }
}
