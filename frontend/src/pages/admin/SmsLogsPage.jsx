import { useState } from 'react';
import { DataTable, DescriptionList, PageHeader, SlideOverDrawer, StatCard, StatusBadge } from '../../components/ui';
import { useSmsGatewaysQuery, useSmsLogsQuery } from '../../app/api';
import { useDocumentTitle, usePermission, useTableState } from '../../hooks';
import { dateTime, number } from '../../lib/format';

const EVENTS = ['registration_welcome', 'payment_receipt', 'membership_activated', 'expiry_reminder', 'membership_renewed', 'otp', 'test'];
const label = (e) => e.replace(/_/g, ' ').replace(/^\w/, (c) => c.toUpperCase());

export default function SmsLogsPage() {
  useDocumentTitle('SMS Delivery Logs');
  const can = usePermission();
  const [params, update, raw] = useTableState();
  const { data, isLoading, isFetching, refetch } = useSmsLogsQuery(params, { pollingInterval: 30000 });
  const { data: gws } = useSmsGatewaysQuery(undefined, { skip: !can('gateways.sms.view|gateways.sms.manage') });
  const [selected, setSelected] = useState(null);
  const s = data?.summary;

  const columns = [
    { key: 'created_at', header: 'Sent', sortable: true, render: (r) => <span className="whitespace-nowrap text-xs tabular-nums text-slate-600">{dateTime(r.created_at)}</span> },
    { key: 'recipient', header: 'Recipient', render: (r) => <div><p className="font-mono text-xs text-navy-900">+{r.recipient}</p>{r.user && <p className="text-2xs text-slate-500">{r.user.name}</p>}</div> },
    { key: 'event', header: 'Event trigger', sortable: true, render: (r) => <span className="rounded bg-slate-100 px-1.5 py-0.5 text-2xs font-medium text-slate-700">{label(r.event)}</span> },
    { key: 'message', header: 'Message', render: (r) => <p className="max-w-xs truncate text-xs text-slate-600" lang={r.locale}>{r.message}</p> },
    { key: 'gateway', header: 'Gateway', render: (r) => r.gateway?.name ?? '—' },
    { key: 'status', header: 'Status', sortable: true, render: (r) => <StatusBadge status={r.status} /> },
    { key: 'provider_response', header: 'Provider response', render: (r) => <code className="block max-w-[200px] truncate text-2xs text-slate-500">{r.http_status ? `${r.http_status} · ` : ''}{r.provider_response}</code> },
  ];

  return (
    <div>
      <PageHeader title="SMS Delivery Logs" description="Audit trail of every SMS attempt, including fallbacks and the raw provider response." />
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Delivered to provider" value={number(s?.sent)} accent="emerald" loading={isLoading} />
        <StatCard label="Failed" value={number(s?.failed)} accent="rose" loading={isLoading} />
        <StatCard label="Segments this month" value={number(s?.segments_month)} loading={isLoading} hint="Billing units" />
      </div>
      <DataTable
        columns={columns}
        data={data}
        onRetry={refetch}
        loading={isLoading}
        fetching={isFetching}
        state={raw}
        onChange={update}
        dense
        onRowClick={setSelected}
        searchPlaceholder="Number, member, message…"
        filters={[
          { key: 'status', label: 'Status', options: [{ value: 'sent', label: 'Sent' }, { value: 'failed', label: 'Failed' }] },
          { key: 'event', label: 'Event', options: EVENTS.map((e) => ({ value: e, label: label(e) })) },
          ...(gws?.data ? [{ key: 'gateway', label: 'Gateway', options: gws.data.map((g) => ({ value: g.id, label: g.name })) }] : []),
        ]}
        emptyTitle="No SMS logged"
      />
      <SlideOverDrawer open={!!selected} onClose={() => setSelected(null)} title="SMS detail" description={selected ? dateTime(selected.created_at) : ''} headerExtra={selected && <StatusBadge status={selected.status} />}>
        {selected && (
          <div className="space-y-6">
            <DescriptionList items={[
              ['Recipient', <span className="font-mono">+{selected.recipient}</span>], ['Member', selected.user?.name], ['Event', label(selected.event)],
              ['Language', selected.locale?.toUpperCase()], ['Gateway', selected.gateway?.name], ['Segments', selected.segments], ['HTTP status', selected.http_status],
            ]} />
            <div>
              <p className="eyebrow mb-2">Message</p>
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm leading-relaxed" lang={selected.locale}>{selected.message}</div>
            </div>
            <div>
              <p className="eyebrow mb-2">Provider response</p>
              <pre className="max-h-72 overflow-auto whitespace-pre-wrap break-all rounded-lg border border-slate-200 bg-slate-50 p-3 font-mono text-2xs text-slate-700">{(() => { try { return JSON.stringify(JSON.parse(selected.provider_response), null, 2); } catch { return selected.provider_response || '—'; } })()}</pre>
            </div>
          </div>
        )}
      </SlideOverDrawer>
    </div>
  );
}
