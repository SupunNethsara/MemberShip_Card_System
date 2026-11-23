<?php

use App\Models\PaymentGateway;
use Illuminate\Database\Migrations\Migration;

/**
 * Adds Onepay as the primary (default, first-listed) payment gateway.
 * It is created inactive because it has no credentials yet: once an admin enters the App ID, App Token and
 * Hash Salt in Admin › Settings › Payment Gateways and switches it on, checkout uses it by default.
 * Until then checkout keeps using whatever gateways are already active (e.g. bank transfer).
 */
return new class extends Migration
{
    public function up(): void
    {
        $gateway = PaymentGateway::query()->firstOrNew(['driver' => 'onepay']);

        if (! $gateway->exists) {
            $gateway->fill([
                'name' => 'Onepay',
                'display_name' => [
                    'en' => 'Card / LANKAQR via Onepay',
                    'si' => 'Onepay හරහා කාඩ්පත් / LANKAQR',
                    'ta' => 'Onepay மூலம் அட்டை / LANKAQR',
                ],
                'mode' => 'live',
                'is_active' => false,
                'settings' => [],
            ]);
        }

        $gateway->is_default = true;
        $gateway->sort_order = 0;
        $gateway->save();

        PaymentGateway::query()->whereKeyNot($gateway->id)->update(['is_default' => false]);
    }

    public function down(): void
    {
        PaymentGateway::query()->where('driver', 'onepay')->whereDoesntHave('transactions')->delete();
        if (! PaymentGateway::query()->where('is_default', true)->exists()) {
            PaymentGateway::query()->where('driver', 'manual')->update(['is_default' => true]);
        }
    }
};
