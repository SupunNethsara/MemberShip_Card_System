<?php

namespace App\Providers;

use App\Models\User;
use App\Policies\RolePolicy;
use App\Services\Payments\PaymentGatewayFactory;
use App\Services\Sms\SmsGatewayFactory;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;
use Spatie\Permission\Models\Role;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->singleton(PaymentGatewayFactory::class);
        $this->app->singleton(SmsGatewayFactory::class);
    }

    public function boot(): void
    {
        // Super Admin implicitly passes every permission & policy check.
        Gate::before(fn (User $user) => $user->hasRole('Super Admin') ? true : null);

        Gate::policy(Role::class, RolePolicy::class);

        RateLimiter::for('login', fn (Request $request) => [
            Limit::perMinute(10)->by(strtolower((string) $request->input('email')).'|'.$request->ip()),
        ]);

        JsonResource::wrap('data');
    }
}
