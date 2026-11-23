<?php

namespace Database\Seeders;

use App\Models\PaymentGateway;
use App\Models\SmsGateway;
use Illuminate\Database\Seeder;

class GatewaySeeder extends Seeder
{
    public function run(): void
    {
        $payments = [
            // Onepay is the primary gateway; it stays inactive until real credentials are entered in admin.
            ['onepay', 'Onepay', ['en' => 'Card / LANKAQR via Onepay', 'si' => 'Onepay හරහා කාඩ්පත් / LANKAQR', 'ta' => 'Onepay மூலம் அட்டை / LANKAQR'], false, true, 0, ['app_id' => '', 'app_token' => '', 'hash_salt' => ''], []],
            ['manual', 'Bank Transfer', ['en' => 'Bank transfer / slip upload', 'si' => 'බැංකු මාරු කිරීම / ලිපිය උඩුගත කිරීම', 'ta' => 'வங்கி பரிமாற்றம் / சீட்டு பதிவேற்றம்'], true, false, 1, [], [
                // Placeholders — replace with the real account in Admin › Settings › Payment Gateways.
                'bank_name' => '(Set bank name in admin)',
                'account_name' => 'Jeewanasaviya',
                'account_number' => '(Set account number in admin)',
                'branch' => '',
                'swift' => '',
                'instructions' => 'Use your invoice number as the payment reference and upload the slip below.',
            ]],
            ['payhere', 'PayHere', ['en' => 'Card / eZ Cash via PayHere', 'si' => 'PayHere හරහා කාඩ්පත් / eZ Cash', 'ta' => 'PayHere மூலம் அட்டை / eZ Cash'], false, false, 2, ['merchant_id' => '', 'merchant_secret' => ''], []],
            ['stripe', 'Stripe', ['en' => 'International card (Stripe)', 'si' => 'ජාත්‍යන්තර කාඩ්පත (Stripe)', 'ta' => 'சர்வதேச அட்டை (Stripe)'], false, false, 3, ['publishable_key' => '', 'secret_key' => '', 'webhook_secret' => ''], []],
            ['webxpay', 'WebXPay', ['en' => 'WebXPay', 'si' => 'WebXPay', 'ta' => 'WebXPay'], false, false, 4, ['secret_key' => '', 'public_key' => ''], []],
        ];

        foreach ($payments as [$driver, $name, $display, $active, $default, $sort, $creds, $settings]) {
            $gateway = PaymentGateway::query()->firstOrNew(['driver' => $driver]);
            $gateway->fill([
                'name' => $name,
                'display_name' => $display,
                'mode' => 'sandbox',
                'is_active' => $active,
                'is_default' => $default,
                'sort_order' => $sort,
                'settings' => $settings,
            ]);
            if (! $gateway->exists) {
                $gateway->fillCredentials($creds);
            }
            $gateway->save();
        }

        $sms = [
            ['log', 'Development Log', true, true, false, 'PRIVILEGE', [], []],
            ['notifylk', 'Notify.lk', false, false, true, 'NotifyDEMO', ['user_id' => '', 'api_key' => ''], []],
            ['dialog', 'Dialog eSMS', false, false, false, 'PRIVILEGE', ['username' => '', 'password' => ''], []],
            ['custom_http', 'Custom Webhook', false, false, false, 'PRIVILEGE', ['api_key' => ''], [
                'endpoint' => 'https://httpbin.org/post',
                'method' => 'POST',
                'body_format' => 'json',
                'headers' => [['key' => 'Authorization', 'value' => 'Bearer {api_key}']],
                'payload' => [['key' => 'to', 'value' => '{to}'], ['key' => 'text', 'value' => '{message}'], ['key' => 'from', 'value' => '{sender}']],
                'success_contains' => '',
            ]],
        ];

        foreach ($sms as [$driver, $name, $active, $primary, $fallback, $sender, $creds, $settings]) {
            $gateway = SmsGateway::query()->firstOrNew(['driver' => $driver]);
            $gateway->fill(compact('name', 'settings') + [
                'is_active' => $active, 'is_primary' => $primary, 'is_fallback' => $fallback, 'sender_id' => $sender,
            ]);
            if (! $gateway->exists) {
                $gateway->fillCredentials($creds);
            }
            $gateway->save();
        }
    }
}
