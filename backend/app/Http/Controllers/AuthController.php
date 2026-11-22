<?php

namespace App\Http\Controllers;

use App\Http\Requests\LoginRequest;
use App\Http\Requests\RegisterRequest;
use App\Http\Requests\UpdateProfileRequest;
use App\Http\Resources\UserResource;
use App\Models\Setting;
use App\Models\SmsTemplate;
use App\Models\User;
use App\Services\AuditLogger;
use App\Services\Sms\SmsService;
use App\Services\UserService;
use App\Support\Phone;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function __construct(
        private readonly UserService $users,
        private readonly SmsService $sms,
        private readonly AuditLogger $audit,
    ) {}

    public function register(RegisterRequest $request): JsonResponse
    {
        $user = $this->users->registerMember($request->validated());

        return $this->tokenResponse($user, 'portal', 201);
    }

    public function sendRegisterOtp(RegisterRequest $request): JsonResponse
    {
        $normalizedPhone = Phone::normalize($request->phone);
        if (User::query()->where('phone', $normalizedPhone)->orWhere('phone', $request->phone)->exists()) {
            throw ValidationException::withMessages([
                'phone' => 'This mobile number is already registered. Please sign in or use a different number.',
            ]);
        }

        $otp = (string) random_int(100000, 999999);
        $locale = in_array($request->input('preferred_locale'), config('portal.locales'), true)
            ? $request->input('preferred_locale')
            : 'en';

        Cache::put("reg_otp:{$normalizedPhone}", [
            'otp' => $otp,
            'payload' => $request->validated(),
            'locale' => $locale,
            'attempts' => 0,
            'sent_at' => now()->timestamp,
        ], now()->addMinutes(10));

        $template = SmsTemplate::query()->where('event', 'otp')->where('is_active', true)->first();
        $siteName = Setting::get('site.name', config('app.name'));
        $message = $template
            ? $template->render($locale, ['otp_code' => $otp, 'site_name' => $siteName])
            : "Your {$siteName} verification code is {$otp}. It expires in 5 minutes.";

        $this->sms->send($normalizedPhone, $message, 'otp', null, null, $locale);

        return response()->json([
            'status' => 'otp_sent',
            'phone' => $request->phone,
            'normalized_phone' => $normalizedPhone,
            'message' => 'Verification code sent to your mobile number.',
            'expires_in' => 600,
            'cooldown' => 60,
        ]);
    }

    public function resendRegisterOtp(Request $request): JsonResponse
    {
        $request->validate([
            'phone' => ['required', 'string'],
        ]);

        $normalizedPhone = Phone::normalize($request->phone);
        $key = "reg_otp:{$normalizedPhone}";
        $cached = Cache::get($key);

        if (! $cached) {
            throw ValidationException::withMessages([
                'otp' => 'Registration session has expired. Please submit the form again.',
            ]);
        }

        $sentAt = $cached['sent_at'] ?? 0;
        $elapsed = now()->timestamp - $sentAt;
        if ($elapsed < 60) {
            $remaining = 60 - $elapsed;
            throw ValidationException::withMessages([
                'otp' => "Please wait {$remaining} seconds before requesting a new code.",
            ]);
        }

        $otp = (string) random_int(100000, 999999);
        $cached['otp'] = $otp;
        $cached['attempts'] = 0;
        $cached['sent_at'] = now()->timestamp;
        Cache::put($key, $cached, now()->addMinutes(10));

        $locale = $cached['locale'] ?? 'en';
        $template = SmsTemplate::query()->where('event', 'otp')->where('is_active', true)->first();
        $siteName = Setting::get('site.name', config('app.name'));
        $message = $template
            ? $template->render($locale, ['otp_code' => $otp, 'site_name' => $siteName])
            : "Your {$siteName} verification code is {$otp}. It expires in 5 minutes.";

        $this->sms->send($normalizedPhone, $message, 'otp', null, null, $locale);

        return response()->json([
            'status' => 'otp_resent',
            'phone' => $request->phone,
            'message' => 'A new verification code has been sent to your mobile number.',
            'cooldown' => 60,
        ]);
    }

    public function verifyRegisterOtp(Request $request): JsonResponse
    {
        $request->validate([
            'phone' => ['required', 'string'],
            'otp' => ['required', 'string'],
        ]);

        $normalizedPhone = Phone::normalize($request->phone);
        $key = "reg_otp:{$normalizedPhone}";
        $cached = Cache::get($key);

        if (! $cached) {
            throw ValidationException::withMessages([
                'otp' => 'Verification code expired or session ended. Please request a new code.',
            ]);
        }

        if (($cached['attempts'] ?? 0) >= 5) {
            Cache::forget($key);
            throw ValidationException::withMessages([
                'otp' => 'Too many invalid attempts. Please start registration again.',
            ]);
        }

        $inputOtp = preg_replace('/\D+/', '', (string) $request->input('otp'));
        if ($inputOtp !== (string) $cached['otp']) {
            $cached['attempts'] = ($cached['attempts'] ?? 0) + 1;
            Cache::put($key, $cached, now()->addMinutes(10));

            throw ValidationException::withMessages([
                'otp' => 'The verification code entered is incorrect.',
            ]);
        }

        Cache::forget($key);

        $payload = $cached['payload'];
        if (User::query()->where('email', strtolower($payload['email']))->exists()) {
            throw ValidationException::withMessages([
                'email' => 'This email is already in use.',
            ]);
        }
        if (User::query()->where('phone', $normalizedPhone)->exists()) {
            throw ValidationException::withMessages([
                'phone' => 'This phone number is already registered.',
            ]);
        }

        $payload['phone'] = $normalizedPhone;
        $payload['phone_verified_at'] = now();

        $user = $this->users->registerMember($payload);

        return $this->tokenResponse($user, 'portal', 201);
    }

    public function sendForgotPasswordOtp(Request $request): JsonResponse
    {
        $request->validate([
            'identifier' => ['required', 'string'],
        ]);

        $identifier = trim($request->string('identifier'));
        $user = null;

        if (str_contains($identifier, '@')) {
            $user = User::query()->where('email', strtolower($identifier))->first();
        } else {
            $normalized = Phone::normalize($identifier);
            $user = User::query()
                ->where('phone', $normalized)
                ->orWhere('phone', $identifier)
                ->first();
        }

        if (! $user) {
            throw ValidationException::withMessages([
                'identifier' => 'No account was found with that email or mobile number.',
            ]);
        }

        if (! $user->phone) {
            throw ValidationException::withMessages([
                'identifier' => 'This account does not have a registered mobile number for SMS OTP. Please contact support.',
            ]);
        }

        if ($user->status !== 'active') {
            $msg = $user->suspension_reason
                ? "This account is suspended: {$user->suspension_reason}. Please contact support."
                : 'This account is suspended. Please contact support.';
            throw ValidationException::withMessages([
                'identifier' => $msg,
            ]);
        }

        $normalizedPhone = Phone::normalize($user->phone);
        $otp = (string) random_int(100000, 999999);
        $locale = in_array($user->preferred_locale, config('portal.locales'), true) ? $user->preferred_locale : 'en';

        Cache::put("pwd_reset_otp:{$normalizedPhone}", [
            'user_id' => $user->id,
            'phone' => $normalizedPhone,
            'otp' => $otp,
            'locale' => $locale,
            'attempts' => 0,
            'sent_at' => now()->timestamp,
        ], now()->addMinutes(10));

        $template = SmsTemplate::query()->where('event', 'password_reset_otp')->where('is_active', true)->first()
            ?? SmsTemplate::query()->where('event', 'otp')->where('is_active', true)->first();
        $siteName = Setting::get('site.name', config('app.name'));
        $vars = [
            'otp_code' => $otp,
            'site_name' => $siteName,
            'member_name' => $user->name,
        ];
        $message = $template
            ? $template->render($locale, $vars)
            : "Your {$siteName} password reset verification code is {$otp}. It expires in 5 minutes.";

        $this->sms->send($normalizedPhone, $message, 'password_reset_otp', $user, null, $locale);

        $masked = strlen($normalizedPhone) > 7
            ? substr($normalizedPhone, 0, 4) . '****' . substr($normalizedPhone, -3)
            : $normalizedPhone;

        return response()->json([
            'status' => 'otp_sent',
            'phone' => $normalizedPhone,
            'masked_phone' => $masked,
            'message' => 'Password reset verification code sent to your registered mobile number.',
            'expires_in' => 600,
            'cooldown' => 60,
        ]);
    }

    public function resendForgotPasswordOtp(Request $request): JsonResponse
    {
        $request->validate([
            'phone' => ['required', 'string'],
        ]);

        $normalizedPhone = Phone::normalize($request->phone);
        $key = "pwd_reset_otp:{$normalizedPhone}";
        $cached = Cache::get($key);

        if (! $cached) {
            throw ValidationException::withMessages([
                'otp' => 'Password reset session has expired. Please enter your email or phone again.',
            ]);
        }

        $sentAt = $cached['sent_at'] ?? 0;
        $elapsed = now()->timestamp - $sentAt;
        if ($elapsed < 60) {
            $remaining = 60 - $elapsed;
            throw ValidationException::withMessages([
                'otp' => "Please wait {$remaining} seconds before requesting a new code.",
            ]);
        }

        $user = User::query()->find($cached['user_id']);
        if (! $user) {
            throw ValidationException::withMessages(['otp' => 'User not found.']);
        }

        $otp = (string) random_int(100000, 999999);
        $cached['otp'] = $otp;
        $cached['attempts'] = 0;
        $cached['sent_at'] = now()->timestamp;
        Cache::put($key, $cached, now()->addMinutes(10));

        $locale = $cached['locale'] ?? 'en';
        $template = SmsTemplate::query()->where('event', 'password_reset_otp')->where('is_active', true)->first()
            ?? SmsTemplate::query()->where('event', 'otp')->where('is_active', true)->first();
        $siteName = Setting::get('site.name', config('app.name'));
        $vars = [
            'otp_code' => $otp,
            'site_name' => $siteName,
            'member_name' => $user->name,
        ];
        $message = $template
            ? $template->render($locale, $vars)
            : "Your {$siteName} password reset verification code is {$otp}. It expires in 5 minutes.";

        $this->sms->send($normalizedPhone, $message, 'password_reset_otp', $user, null, $locale);

        return response()->json([
            'status' => 'otp_resent',
            'phone' => $normalizedPhone,
            'message' => 'A new verification code has been sent to your mobile number.',
            'cooldown' => 60,
        ]);
    }

    public function resetPasswordWithOtp(Request $request): JsonResponse
    {
        $request->validate([
            'phone' => ['required', 'string'],
            'otp' => ['required', 'string'],
            'password' => ['required', 'confirmed', Password::min(8)->letters()->numbers()],
        ]);

        $normalizedPhone = Phone::normalize($request->phone);
        $key = "pwd_reset_otp:{$normalizedPhone}";
        $cached = Cache::get($key);

        if (! $cached) {
            throw ValidationException::withMessages([
                'otp' => 'Password reset session has expired or is invalid. Please request a new code.',
            ]);
        }

        if (($cached['attempts'] ?? 0) >= 5) {
            Cache::forget($key);
            throw ValidationException::withMessages([
                'otp' => 'Too many invalid attempts. Please start password reset again.',
            ]);
        }

        $inputOtp = preg_replace('/\D+/', '', (string) $request->input('otp'));
        if ($inputOtp !== (string) $cached['otp']) {
            $cached['attempts'] = ($cached['attempts'] ?? 0) + 1;
            Cache::put($key, $cached, now()->addMinutes(10));

            throw ValidationException::withMessages([
                'otp' => 'The verification code entered is incorrect.',
            ]);
        }

        Cache::forget($key);

        $user = User::query()->findOrFail($cached['user_id']);
        $user->forceFill([
            'password' => $request->string('password'),
        ])->save();

        $user->tokens()->delete();

        $this->audit->log('auth.password_reset', "Password reset via SMS OTP for {$user->name}", $user);

        return $this->tokenResponse($user, 'portal', 200);
    }

    public function login(LoginRequest $request): JsonResponse
    {
        $user = User::query()->where('email', strtolower($request->string('email')))->first();

        if (! $user || ! Hash::check($request->string('password'), $user->password)) {
            throw ValidationException::withMessages(['email' => __('auth.failed')]);
        }
        if ($user->status !== 'active') {
            $msg = $user->suspension_reason
                ? "This account is suspended: {$user->suspension_reason}. Please contact support."
                : 'This account is suspended. Please contact support.';
            throw ValidationException::withMessages(['email' => $msg]);
        }

        $user->forceFill(['last_login_at' => now()])->save();

        return $this->tokenResponse($user, $request->input('device_name', 'portal'));
    }

    public function me(Request $request): UserResource
    {
        return $this->resource($request->user());
    }

    public function updateProfile(UpdateProfileRequest $request): UserResource
    {
        $data = collect($request->validated())->except(['current_password', 'password_confirmation'])->filter(fn ($v, $k) => $k !== 'password' || $v)->all();
        $request->user()->update($data);

        return $this->resource($request->user()->refresh());
    }

    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()?->delete();

        return response()->json(['message' => 'Logged out']);
    }

    private function tokenResponse(User $user, string $device, int $status = 200): JsonResponse
    {
        $token = $user->createToken($device ?: 'portal')->plainTextToken;

        return response()->json(['token' => $token, 'user' => $this->resource($user)], $status);
    }

    private function resource(User $user): UserResource
    {
        $user->load(['roles', 'activeMembership.tier']);

        return (new UserResource($user))->withAccess();
    }
}
