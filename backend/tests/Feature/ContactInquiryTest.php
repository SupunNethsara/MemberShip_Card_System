<?php

namespace Tests\Feature;

use App\Models\ContactInquiry;
use App\Models\User;
use App\Notifications\PortalNotification;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ContactInquiryTest extends TestCase
{
    use RefreshDatabase;

    private User $support;

    private User $partnerManager;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RolePermissionSeeder::class);

        $this->support = User::factory()->create(['is_staff' => true, 'status' => 'active']);
        $this->support->assignRole('Support Staff');

        $this->partnerManager = User::factory()->create(['is_staff' => true, 'status' => 'active']);
        $this->partnerManager->assignRole('Partner Manager');
    }

    private function payload(array $overrides = []): array
    {
        return array_merge([
            'name' => 'Nimal Perera',
            'email' => 'nimal@example.com',
            'phone' => '0771234567',
            'subject' => 'membership',
            'message' => 'How do I upgrade to the Gold card?',
        ], $overrides);
    }

    public function test_public_form_saves_inquiry_and_notifies_only_permitted_staff(): void
    {
        Notification::fake();

        $this->postJson('/api/public/contact', $this->payload())->assertCreated();

        $this->assertDatabaseHas('contact_inquiries', ['name' => 'Nimal Perera', 'subject' => 'membership', 'status' => 'new']);
        Notification::assertSentTo($this->support, PortalNotification::class);
        Notification::assertNotSentTo($this->partnerManager, PortalNotification::class);
    }

    public function test_public_form_requires_email_or_phone_and_valid_subject(): void
    {
        $this->postJson('/api/public/contact', $this->payload(['email' => null, 'phone' => null]))
            ->assertUnprocessable()->assertJsonValidationErrors(['email', 'phone']);

        $this->postJson('/api/public/contact', $this->payload(['subject' => 'hacking']))
            ->assertUnprocessable()->assertJsonValidationErrors(['subject']);

        $this->assertDatabaseCount('contact_inquiries', 0);
    }

    public function test_honeypot_submissions_are_kept_as_spam_without_alerting_staff(): void
    {
        // Browsers can autofill the hidden field, so a hit must never lose a real person's message.
        Notification::fake();

        $this->postJson('/api/public/contact', $this->payload(['website' => 'http://spam.example']))->assertCreated();

        $this->assertDatabaseHas('contact_inquiries', ['name' => 'Nimal Perera', 'status' => 'spam']);
        Notification::assertNothingSent();
    }

    public function test_staff_with_permission_can_list_update_and_delete(): void
    {
        $inquiry = ContactInquiry::query()->create($this->payload(['status' => 'new']));
        Sanctum::actingAs($this->support);

        $this->getJson('/api/admin/inquiries')->assertOk()
            ->assertJsonPath('summary.new', 1)
            ->assertJsonPath('data.0.subject_label', 'Membership Registration & Tiers');
        $this->getJson('/api/admin/inquiries/new-count')->assertOk()->assertJsonPath('count', 1);

        $this->putJson("/api/admin/inquiries/{$inquiry->id}", ['status' => 'resolved', 'staff_note' => 'Called back'])
            ->assertOk()->assertJsonPath('data.status', 'resolved')->assertJsonPath('data.handler.id', $this->support->id);

        $this->deleteJson("/api/admin/inquiries/{$inquiry->id}")->assertOk();
        $this->assertDatabaseCount('contact_inquiries', 0);
    }

    public function test_staff_without_permission_and_guests_are_blocked(): void
    {
        $inquiry = ContactInquiry::query()->create($this->payload());

        $this->getJson('/api/admin/inquiries')->assertUnauthorized();

        Sanctum::actingAs($this->partnerManager);
        $this->getJson('/api/admin/inquiries')->assertForbidden();
        $this->putJson("/api/admin/inquiries/{$inquiry->id}", ['status' => 'resolved'])->assertForbidden();
    }
}
