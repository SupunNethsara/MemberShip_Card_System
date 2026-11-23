import { Link } from 'react-router-dom';
import { ArrowRight, Building2, CalendarClock, MessageSquare, Users, Wallet } from 'lucide-react';
import { Alert, Button, Card, LoadError, PageHeader, Skeleton, StatCard, TierBadge } from '../../components/ui';
import { BarChart, DistributionBars, LineChart } from '../../components/charts/Charts';
import { useAdminDashboardQuery } from '../../app/api';
import { useCurrentUser, useDocumentTitle } from '../../hooks';
import { compactMoney, money, number, relative } from '../../lib/format';

export default function DashboardPage() {
  useDocumentTitle('Dashboard');
  const user = useCurrentUser();
  const { data, isLoading, isError, refetch } = useAdminDashboardQuery(undefined, { pollingInterval: 60000 });
  const k = data?.kpis || {};
  const series = data?.revenue_series || [];

  // Without this, a failed load would show a dashboard of zeros that looks like real numbers.
  if (isError && !data) {
    return (
      <div className="space-y-6">
        <PageHeader title={`Good ${greeting()}, ${user?.name?.split(' ')[0] ?? ''}`} />
        <LoadError onRetry={refetch} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader eyebrow={new Date().toLocaleDateString('en-LK', { weekday: 'long', day: 'numeric', month: 'long' })} title={`Good ${greeting()}, ${user?.name?.split(' ')[0] ?? ''}`} description="Live overview of members, revenue and partner activity." />

      {k.pending_approvals > 0 && (
        <Alert tone="warning" title={`${k.pending_approvals} bank transfer${k.pending_approvals > 1 ? 's' : ''} awaiting approval`} action={<Link to="/admin/invoices?status=awaiting_approval"><Button size="sm" variant="secondary" iconRight={ArrowRight}>Review</Button></Link>}>
          Members are waiting for their cards to activate.
        </Alert>
      )}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <StatCard loading={isLoading} label="Active members" value={number(k.active_members)} icon={Users} accent="emerald" hint={`${number(k.new_members_month)} joined this month`} />
        <StatCard loading={isLoading} label="Total revenue" value={compactMoney(k.revenue_total)} icon={Wallet} hint={`${compactMoney(k.revenue_month)} this month`} change={k.revenue_change ?? undefined} />
        <StatCard loading={isLoading} label="Expiring in 30 days" value={number(k.expiring_30_days)} icon={CalendarClock} accent="amber" hint="Reminders go out at 7 days" />
        <StatCard loading={isLoading} label="Active partners" value={number(k.active_partners)} icon={Building2} />
        <StatCard loading={isLoading} label="SMS sent (month)" value={number(k.sms_sent_month)} icon={MessageSquare} accent={k.sms_failed_month ? 'rose' : 'slate'} hint={k.sms_failed_month ? `${k.sms_failed_month} failed` : 'segments'} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[2fr_1fr]">
        <Card title="Revenue" description="Paid invoices, last 12 months (LKR)">
          {isLoading ? <Skeleton className="h-56" /> : <BarChart data={series.map((s) => ({ label: s.label, value: s.revenue }))} format={(v) => money(v)} />}
        </Card>
        <Card title="Active members by tier">
          {isLoading ? <Skeleton className="h-40" /> : <DistributionBars data={(data?.tier_distribution || []).map((t) => ({ label: t.name, value: t.count, color: t.color }))} />}
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[2fr_1fr]">
        <Card title="Membership growth" description="New memberships activated per month">
          {isLoading ? <Skeleton className="h-56" /> : <LineChart data={series.map((s) => ({ label: s.label, value: s.memberships }))} format={(v) => `${v} memberships`} />}
        </Card>
        <Card title="Recent payments" bodyClass="p-0" actions={<Link to="/admin/invoices" className="text-xs font-medium text-slate-600 hover:text-navy-900">View all</Link>}>
          <ul className="divide-y divide-slate-100">
            {isLoading && [0, 1, 2, 3].map((i) => <li key={i} className="px-5 py-3"><Skeleton className="h-8" /></li>)}
            {(data?.recent_payments || []).map((p) => (
              <li key={p.id} className="flex items-center justify-between gap-3 px-5 py-3">
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-medium text-navy-900">{p.member}</p>
                  <div className="mt-0.5 flex items-center gap-2 text-2xs text-slate-500">
                    <TierBadge name={p.tier} color={p.tier_color} />
                    <span>{relative(p.paid_at)}</span>
                  </div>
                </div>
                <span className="text-[13px] font-semibold tabular-nums text-navy-900">{money(p.amount)}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? 'morning' : h < 17 ? 'afternoon' : 'evening';
}
