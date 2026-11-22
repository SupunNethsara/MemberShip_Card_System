<?php

namespace Database\Seeders;

use App\Models\Invoice;
use App\Models\Membership;
use App\Models\MembershipTier;
use App\Models\PaymentGateway;
use App\Models\PaymentTransaction;
use App\Models\SmsGateway;
use App\Models\SmsLog;
use App\Models\User;
use App\Services\AuditLogger;
use App\Services\MembershipService;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;

class DemoUserSeeder extends Seeder
{
    public function run(MembershipService $memberships, AuditLogger $audit): void
    {
        $staff = [
            ['Super Admin', 'Nimal Perera', 'admin@portal.lk', 'Admin@12345'],
            ['Operations Manager', 'Shalini Fernando', 'ops@portal.lk', 'Staff@12345'],
            ['Partner Manager', 'Kasun Jayasinghe', 'partners@portal.lk', 'Staff@12345'],
            ['Finance & Gateways Admin', 'Priya Rajendran', 'finance@portal.lk', 'Staff@12345'],
            ['Support Staff', 'Ishara Wickramasinghe', 'support@portal.lk', 'Staff@12345'],
        ];

        foreach ($staff as [$role, $name, $email, $password]) {
            $user = User::query()->updateOrCreate(['email' => $email], [
                'name' => $name, 'password' => $password, 'is_staff' => true, 'status' => 'active', 'phone' => '0770000000',
            ]);
            $user->syncRoles([$role]);
        }

        $tiers = MembershipTier::query()->orderBy('priority')->get()->keyBy('slug');
        $manual = PaymentGateway::query()->where('driver', 'manual')->first();
        $smsGw = SmsGateway::query()->where('driver', 'log')->first();

        // Primary demo member with an active Gold plan.
        $demo = $this->member('Tharindu Silva', 'member@portal.lk', '0771234567', 'en', 'Member@12345', now()->subMonths(5));
        $this->purchase($demo, $tiers['gold'], now()->subMonths(5), $manual, $memberships);

        $names = [
            ['Dilani Abeysekara', 'si'], ['Ruwan Kumara', 'si'], ['Meena Sivakumar', 'ta'], ['Ashan Gunawardena', 'en'],
            ['Kavya Nadarajah', 'ta'], ['Chamara Bandara', 'si'], ['Fathima Rizvi', 'en'], ['Sanjeewa Herath', 'si'],
            ['Nilani Pathmanathan', 'ta'], ['Dinesh Rathnayake', 'en'], ['Harshi Senanayake', 'si'], ['Arjun Thevarajah', 'ta'],
            ['Malsha De Silva', 'en'], ['Lahiru Weerasinghe', 'si'], ['Shanthi Kanagaratnam', 'ta'], ['Gayan Dissanayake', 'si'],
            ['Roshini Fernando', 'en'], ['Thilina Ekanayake', 'si'], ['Vasuki Murugan', 'ta'], ['Nadeesha Karunaratne', 'si'],
            ['Imran Hassan', 'en'], ['Sachini Mendis', 'si'], ['Pradeep Rajapaksha', 'si'], ['Janani Selvaraj', 'ta'],
        ];

        $tierCycle = ['silver', 'gold', 'silver', 'platinum', 'gold', 'silver', 'gold', 'platinum'];

        foreach ($names as $i => [$name, $locale]) {
            $joined = now()->subDays(20 + ($i * 13) % 340)->setTime(10 + $i % 8, ($i * 7) % 60);
            $email = strtolower(str_replace(' ', '.', $name)).'@example.lk';
            $phone = '07'.(1 + $i % 8).str_pad((string) (1000000 + $i * 37919), 7, '0', STR_PAD_LEFT);
            $user = $this->member($name, $email, $phone, $locale, 'Member@12345', $joined);

            if ($i % 9 === 8) {
                continue; // registered but never purchased
            }

            $tier = $tiers[$tierCycle[$i % count($tierCycle)]];
            $this->purchase($user, $tier, $joined, $manual, $memberships);

            // A few memberships about to expire (dashboard "Expiring in 30 days").
            if ($i % 6 === 2) {
                $user->memberships()->where('status', 'active')->update(['expires_at' => now()->addDays(4 + $i % 20)]);
            }
            // A couple already expired.
            if ($i % 11 === 5) {
                $user->memberships()->where('status', 'active')->update(['expires_at' => now()->subDays(3), 'status' => 'expired']);
            }
        }

        // One awaiting slip approval, for the finance queue.
        $pendingUser = User::query()->where('email', 'fathima.rizvi@example.lk')->first();
        if ($pendingUser) {
            Invoice::query()->create([
                'number' => 'INV-'.now()->format('Y').'-9'.str_pad((string) $pendingUser->id, 5, '0', STR_PAD_LEFT),
                'user_id' => $pendingUser->id,
                'membership_tier_id' => $tiers['platinum']->id,
                'payment_gateway_id' => $manual->id,
                'type' => 'upgrade',
                'amount' => $tiers['platinum']->price,
                'currency' => 'LKR',
                'status' => 'awaiting_approval',
            ]);
        }

        // Representative SMS history.
        foreach (User::query()->where('is_staff', false)->limit(15)->get() as $k => $u) {
            SmsLog::query()->create([
                'user_id' => $u->id,
                'sms_gateway_id' => $smsGw?->id,
                'recipient' => \App\Support\Phone::normalize($u->phone),
                'event' => $k % 3 === 0 ? 'membership_activated' : ($k % 3 === 1 ? 'payment_receipt' : 'registration_welcome'),
                'locale' => $u->preferred_locale,
                'message' => "Seeded message for {$u->name}",
                'status' => $k % 7 === 6 ? 'failed' : 'sent',
                'http_status' => $k % 7 === 6 ? 500 : 200,
                'provider_response' => $k % 7 === 6 ? '{"error":"Upstream timeout"}' : '{"status":"logged"}',
                'segments' => 1,
                'created_at' => now()->subDays($k * 3),
                'updated_at' => now()->subDays($k * 3),
            ]);
        }

        $admin = User::query()->where('email', 'admin@portal.lk')->first();
        auth()->setUser($admin);
        $audit->log('system.seeded', 'Database seeded with demo data');
        auth()->forgetUser();
    }

    private function member(string $name, string $email, string $phone, string $locale, string $password, Carbon $joined): User
    {
        $user = User::query()->updateOrCreate(['email' => $email], [
            'name' => $name, 'phone' => $phone, 'preferred_locale' => $locale, 'password' => $password,
            'is_staff' => false, 'status' => 'active',
        ]);
        $user->forceFill(['created_at' => $joined])->save();
        $user->syncRoles(['Member']);
        $user->member_code = null;

        return app(MembershipService::class)->ensureMemberIdentity($user);
    }

    /** Creates a paid invoice + transaction + active membership without sending SMS. */
    private function purchase(User $user, MembershipTier $tier, Carbon $at, PaymentGateway $gateway, MembershipService $memberships): void
    {
        $seq = Invoice::query()->count() + 1;
        $invoice = Invoice::query()->create([
            'number' => sprintf('INV-%s-%06d', $at->format('Y'), $seq),
            'user_id' => $user->id,
            'membership_tier_id' => $tier->id,
            'payment_gateway_id' => $gateway->id,
            'type' => 'new',
            'amount' => $tier->price,
            'currency' => 'LKR',
            'status' => 'paid',
            'paid_at' => $at,
            'created_at' => $at,
            'updated_at' => $at,
        ]);

        $membership = Membership::query()->create([
            'user_id' => $user->id,
            'membership_tier_id' => $tier->id,
            'status' => 'active',
            'source' => 'payment',
            'starts_at' => $at,
            'expires_at' => $tier->expiryFrom($at),
            'created_at' => $at,
            'updated_at' => $at,
        ]);
        $invoice->update(['membership_id' => $membership->id]);

        PaymentTransaction::query()->create([
            'invoice_id' => $invoice->id,
            'payment_gateway_id' => $gateway->id,
            'driver' => $gateway->driver,
            'direction' => 'manual',
            'reference' => $invoice->number,
            'status' => 'success',
            'amount' => $tier->price,
            'payload' => ['seeded' => true],
            'message' => 'Seeded payment',
            'created_at' => $at,
            'updated_at' => $at,
        ]);
    }
}
