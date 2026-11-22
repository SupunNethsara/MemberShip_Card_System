<?php

namespace App\Services;

use App\Models\Invoice;
use App\Models\Membership;
use App\Models\MembershipTier;
use App\Models\Partner;
use App\Models\SmsLog;
use App\Models\User;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

class DashboardService
{
    public function summary(): array
    {
        $now = now();
        $monthStart = $now->copy()->startOfMonth();
        $prevMonthStart = $monthStart->copy()->subMonth();

        $activeMembers = Membership::query()->where('status', 'active')->where('expires_at', '>', $now)->distinct('user_id')->count('user_id');
        $revenueTotal = (float) Invoice::query()->where('status', 'paid')->sum('amount');
        $revenueMonth = (float) Invoice::query()->where('status', 'paid')->where('paid_at', '>=', $monthStart)->sum('amount');
        $revenuePrev = (float) Invoice::query()->where('status', 'paid')->whereBetween('paid_at', [$prevMonthStart, $monthStart])->sum('amount');

        return [
            'kpis' => [
                'active_members' => $activeMembers,
                'total_members' => User::query()->where('is_staff', false)->count(),
                'new_members_month' => User::query()->where('is_staff', false)->where('created_at', '>=', $monthStart)->count(),
                'revenue_total' => $revenueTotal,
                'revenue_month' => $revenueMonth,
                'revenue_change' => $revenuePrev > 0 ? round((($revenueMonth - $revenuePrev) / $revenuePrev) * 100, 1) : null,
                'expiring_30_days' => Membership::query()->where('status', 'active')->whereBetween('expires_at', [$now, $now->copy()->addDays(30)])->count(),
                'active_partners' => Partner::query()->where('is_active', true)->count(),
                'sms_sent_month' => SmsLog::query()->where('status', 'sent')->where('created_at', '>=', $monthStart)->sum('segments'),
                'sms_failed_month' => SmsLog::query()->where('status', 'failed')->where('created_at', '>=', $monthStart)->count(),
                'pending_approvals' => Invoice::query()->where('status', 'awaiting_approval')->count(),
            ],
            'revenue_series' => $this->monthlySeries(),
            'tier_distribution' => $this->tierDistribution(),
            'recent_payments' => Invoice::query()->with(['user:id,name,member_code', 'tier:id,name,color'])
                ->where('status', 'paid')->latest('paid_at')->limit(6)->get()
                ->map(fn (Invoice $i) => [
                    'id' => $i->id,
                    'number' => $i->number,
                    'member' => $i->user?->name,
                    'member_code' => $i->user?->member_code,
                    'tier' => $i->tier?->translate('name', 'en'),
                    'tier_color' => $i->tier?->color,
                    'amount' => (float) $i->amount,
                    'paid_at' => $i->paid_at?->toIso8601String(),
                ]),
        ];
    }

    /** Last 12 months of revenue and new memberships. */
    private function monthlySeries(): array
    {
        $from = now()->startOfMonth()->subMonths(11);

        $revenue = Invoice::query()
            ->where('status', 'paid')->where('paid_at', '>=', $from)
            ->selectRaw("DATE_FORMAT(paid_at, '%Y-%m') as ym, SUM(amount) as total")
            ->groupBy('ym')->pluck('total', 'ym');

        $members = Membership::query()
            ->where('created_at', '>=', $from)->whereIn('status', ['active', 'expired'])
            ->selectRaw("DATE_FORMAT(created_at, '%Y-%m') as ym, COUNT(*) as total")
            ->groupBy('ym')->pluck('total', 'ym');

        return collect(range(0, 11))->map(function ($i) use ($from, $revenue, $members) {
            $m = Carbon::parse($from)->addMonths($i);
            $key = $m->format('Y-m');

            return ['month' => $key, 'label' => $m->format('M'), 'revenue' => (float) ($revenue[$key] ?? 0), 'memberships' => (int) ($members[$key] ?? 0)];
        })->all();
    }

    private function tierDistribution(): array
    {
        $counts = Membership::query()
            ->where('status', 'active')->where('expires_at', '>', now())
            ->select('membership_tier_id', DB::raw('COUNT(*) as total'))
            ->groupBy('membership_tier_id')->pluck('total', 'membership_tier_id');

        return MembershipTier::query()->orderBy('priority')->get()->map(fn ($t) => [
            'id' => $t->id,
            'name' => $t->translate('name', 'en'),
            'color' => $t->color,
            'count' => (int) ($counts[$t->id] ?? 0),
        ])->all();
    }
}
