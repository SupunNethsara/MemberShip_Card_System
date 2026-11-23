<?php

namespace Tests\Feature;

use App\Mail\OtpCodeMail;
use App\Models\Setting;
use App\Models\SmsGateway;
use App\Models\User;
use App\Support\Phone;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class AuthOtpTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RolePermissionSeeder::class);
        Setting::put('site.name', 'Jeewanasaviya Test');
        Setting::put('sms.enabled', false);
    }

    public function test_send_register_otp_stores_session_and_does_not_expose_otp(): void
    {
        $payload = [
            'name' => 'Kamal Perera',
            'email' => 'kamal@example.com',
            'phone' => '0771234567',
            'password' => 'SecurePass123',
            'password_confirmation' => 'SecurePass123',
            'preferred_locale' => 'en',
        ];

        $response = $this->postJson('/api/auth/register/send-otp', $payload);

        $response->assertStatus(200)
            ->assertJson([
                'status' => 'otp_sent',
                'phone' => '0771234567',
                'normalized_phone' => '94771234567',
                'cooldown' => 60,
            ]);

        // Verify DEV OTP is NEVER exposed in the JSON response
        $data = $response->json();
        $this->assertArrayNotHasKey('otp', $data);
        $this->assertArrayNotHasKey('dev_otp', $data);
        $this->assertArrayNotHasKey('code_dev', $data);

        // Verify OTP is stored in Cache under normalized phone key
        $cached = Cache::get('reg_otp:94771234567');
        $this->assertNotNull($cached);
        $this->assertNotEmpty($cached['otp']);
        $this->assertEquals(6, strlen($cached['otp']));
        $this->assertEquals('kamal@example.com', $cached['payload']['email']);
    }

    private function registerPayload(): array
    {
        return [
            'name' => 'Kamal Perera',
            'email' => 'kamal@example.com',
            'phone' => '0771234567',
            'password' => 'SecurePass123',
            'password_confirmation' => 'SecurePass123',
            'preferred_locale' => 'en',
        ];
    }

    public function test_register_otp_is_emailed_when_no_sms_gateway_is_set_up(): void
    {
        Mail::fake();

        $this->postJson('/api/auth/register/send-otp', $this->registerPayload())
            ->assertOk()
            ->assertJson(['channel' => 'email', 'destination' => 'k****@example.com']);

        $code = Cache::get('reg_otp:94771234567')['otp'];
        Mail::assertSent(OtpCodeMail::class, fn (OtpCodeMail $mail) => $mail->hasTo('kamal@example.com') && $mail->code === $code);
    }

    public function test_dev_log_gateway_does_not_count_as_real_sms_so_otp_is_emailed(): void
    {
        Mail::fake();
        Setting::put('sms.enabled', true);
        SmsGateway::query()->create(['driver' => 'log', 'name' => 'Development Log', 'is_active' => true, 'is_primary' => true]);

        $this->postJson('/api/auth/register/send-otp', $this->registerPayload())
            ->assertOk()
            ->assertJson(['channel' => 'email']);

        Mail::assertSent(OtpCodeMail::class);
    }

    public function test_send_register_otp_fails_if_phone_already_exists(): void
    {
        User::factory()->create([
            'phone' => '94771234567',
            'email' => 'existing@example.com',
        ]);

        $payload = [
            'name' => 'Kamal Perera',
            'email' => 'new@example.com',
            'phone' => '0771234567',
            'password' => 'SecurePass123',
            'password_confirmation' => 'SecurePass123',
        ];

        $response = $this->postJson('/api/auth/register/send-otp', $payload);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['phone']);
    }

    public function test_resend_register_otp_enforces_cooldown(): void
    {
        $payload = [
            'name' => 'Kamal Perera',
            'email' => 'kamal@example.com',
            'phone' => '0771234567',
            'password' => 'SecurePass123',
            'password_confirmation' => 'SecurePass123',
        ];

        $this->postJson('/api/auth/register/send-otp', $payload);

        // Immediate resend must fail due to 60s cooldown
        $resendResponse = $this->postJson('/api/auth/register/resend-otp', ['phone' => '0771234567']);
        $resendResponse->assertStatus(422)
            ->assertJsonValidationErrors(['otp']);

        // Simulate cooldown elapsed by setting sent_at 65 seconds ago
        $cached = Cache::get('reg_otp:94771234567');
        $this->assertNotNull($cached);
        $cached['sent_at'] = now()->timestamp - 65;
        Cache::put('reg_otp:94771234567', $cached, now()->addMinutes(10));

        $resendSuccess = $this->postJson('/api/auth/register/resend-otp', ['phone' => '0771234567']);
        $resendSuccess->assertStatus(200)
            ->assertJson(['status' => 'otp_resent']);

        $resendData = $resendSuccess->json();
        $this->assertArrayNotHasKey('otp', $resendData);
        $this->assertArrayNotHasKey('dev_otp', $resendData);
    }

    public function test_verify_register_otp_fails_with_invalid_otp(): void
    {
        $payload = [
            'name' => 'Kamal Perera',
            'email' => 'kamal@example.com',
            'phone' => '0771234567',
            'password' => 'SecurePass123',
            'password_confirmation' => 'SecurePass123',
        ];

        $this->postJson('/api/auth/register/send-otp', $payload);

        $response = $this->postJson('/api/auth/register/verify-otp', [
            'phone' => '0771234567',
            'otp' => '000000',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['otp']);

        $cached = Cache::get('reg_otp:94771234567');
        $this->assertEquals(1, $cached['attempts']);
    }

    public function test_verify_register_otp_locks_after_5_failed_attempts(): void
    {
        $payload = [
            'name' => 'Kamal Perera',
            'email' => 'kamal@example.com',
            'phone' => '0771234567',
            'password' => 'SecurePass123',
            'password_confirmation' => 'SecurePass123',
        ];

        $this->postJson('/api/auth/register/send-otp', $payload);

        for ($i = 0; $i < 5; $i++) {
            $this->postJson('/api/auth/register/verify-otp', [
                'phone' => '0771234567',
                'otp' => '111111',
            ]);
        }

        // 6th attempt should report session expired or too many attempts
        $response = $this->postJson('/api/auth/register/verify-otp', [
            'phone' => '0771234567',
            'otp' => '111111',
        ]);

        $response->assertStatus(422);
        $this->assertNull(Cache::get('reg_otp:94771234567'));
    }

    public function test_verify_register_otp_successfully_creates_member(): void
    {
        $payload = [
            'name' => 'Kamal Perera',
            'email' => 'kamal@example.com',
            'phone' => '0771234567',
            'password' => 'SecurePass123',
            'password_confirmation' => 'SecurePass123',
            'preferred_locale' => 'en',
        ];

        $this->postJson('/api/auth/register/send-otp', $payload);
        $cached = Cache::get('reg_otp:94771234567');
        $otp = $cached['otp'];

        $response = $this->postJson('/api/auth/register/verify-otp', [
            'phone' => '0771234567',
            'otp' => $otp,
        ]);

        $response->assertStatus(201)
            ->assertJsonStructure([
                'token',
                'user' => [
                    'id', 'name', 'email', 'phone', 'member_code', 'status',
                ],
            ]);

        $this->assertDatabaseHas('users', [
            'email' => 'kamal@example.com',
            'phone' => '94771234567',
            'status' => 'active',
            'is_staff' => false,
        ]);

        $user = User::where('email', 'kamal@example.com')->first();
        $this->assertTrue($user->hasRole('Member'));
        $this->assertMatchesRegularExpression('/^JHMS \d{4} \d{4}$/', $user->member_code);
        $this->assertNotNull($user->card_token);
        $this->assertNotNull($user->phone_verified_at);

        // Cache session is cleared
        $this->assertNull(Cache::get('reg_otp:94771234567'));
    }

    public function test_login_with_valid_credentials(): void
    {
        $user = User::factory()->create([
            'email' => 'member@example.com',
            'password' => Hash::make('Secret1234'),
            'status' => 'active',
            'phone' => '94771234567',
        ]);
        $user->assignRole('Member');

        $response = $this->postJson('/api/auth/login', [
            'email' => 'member@example.com',
            'password' => 'Secret1234',
        ]);

        $response->assertStatus(200)
            ->assertJsonStructure([
                'token',
                'user' => ['id', 'email', 'name'],
            ]);
    }

    public function test_login_with_invalid_credentials_fails(): void
    {
        User::factory()->create([
            'email' => 'member@example.com',
            'password' => Hash::make('Secret1234'),
            'status' => 'active',
        ]);

        $response = $this->postJson('/api/auth/login', [
            'email' => 'member@example.com',
            'password' => 'WrongPassword',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['email']);
    }

    public function test_suspended_user_is_blocked_from_login(): void
    {
        $user = User::factory()->create([
            'email' => 'suspended@example.com',
            'password' => Hash::make('Secret1234'),
            'status' => 'suspended',
            'suspension_reason' => 'Violation of portal policies',
            'phone' => '94771234567',
        ]);
        $user->assignRole('Member');

        $response = $this->postJson('/api/auth/login', [
            'email' => 'suspended@example.com',
            'password' => 'Secret1234',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['email']);

        $this->assertStringContainsString('Violation of portal policies', $response->json('errors.email.0'));
    }

    public function test_forgot_password_otp_request_and_reset_flow(): void
    {
        $user = User::factory()->create([
            'name' => 'Nimal Jayawardena',
            'email' => 'nimal@example.com',
            'phone' => '94777654321',
            'password' => Hash::make('OldPassword1'),
            'status' => 'active',
        ]);
        $user->assignRole('Member');

        // Request forgot password OTP via email identifier
        $sendResponse = $this->postJson('/api/auth/forgot-password/send-otp', [
            'identifier' => 'nimal@example.com',
        ]);

        $sendResponse->assertStatus(200)
            ->assertJson([
                'status' => 'otp_sent',
                'phone' => '94777654321',
            ]);

        // Verify DEV OTP is NEVER exposed in the JSON response
        $sendData = $sendResponse->json();
        $this->assertArrayNotHasKey('otp', $sendData);
        $this->assertArrayNotHasKey('dev_otp', $sendData);

        // Fetch OTP from cache
        $cached = Cache::get('pwd_reset_otp:94777654321');
        $this->assertNotNull($cached);
        $otp = $cached['otp'];

        // Reset password with valid OTP
        $resetResponse = $this->postJson('/api/auth/forgot-password/reset', [
            'phone' => '0777654321',
            'otp' => $otp,
            'password' => 'NewSecurePassword123',
            'password_confirmation' => 'NewSecurePassword123',
        ]);

        $resetResponse->assertStatus(200)
            ->assertJsonStructure(['token', 'user']);

        // Verify old password no longer works, new password works
        $user->refresh();
        $this->assertTrue(Hash::check('NewSecurePassword123', $user->password));
        $this->assertFalse(Hash::check('OldPassword1', $user->password));

        // Test login with new password
        $loginResponse = $this->postJson('/api/auth/login', [
            'email' => 'nimal@example.com',
            'password' => 'NewSecurePassword123',
        ]);
        $loginResponse->assertStatus(200);
    }

    public function test_forgot_password_fails_for_suspended_user(): void
    {
        User::factory()->create([
            'email' => 'banned@example.com',
            'phone' => '94771122334',
            'password' => Hash::make('Password123'),
            'status' => 'suspended',
            'suspension_reason' => 'Fraudulent activity detected',
        ]);

        $response = $this->postJson('/api/auth/forgot-password/send-otp', [
            'identifier' => 'banned@example.com',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['identifier']);

        $this->assertStringContainsString('Fraudulent activity detected', $response->json('errors.identifier.0'));
    }
}
