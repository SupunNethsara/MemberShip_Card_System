import { useState } from 'react';
import { CreditCard, FileClock, KeyRound, ShieldAlert, ShieldCheck, Smartphone, UserCog } from 'lucide-react';
import { DataTable, DescriptionList, Icon, PageHeader, SlideOverDrawer } from '../../components/ui';
import { useAuditLogsQuery } from '../../app/api';
import { useDocumentTitle, useTableState } from '../../hooks';
import { dateTime } from '../../lib/format';

const ACTION_META = [
  ['permissions', ShieldCheck, 'text-violet-700 bg-violet-50'],
  ['role', ShieldCheck, 'text-violet-700 bg-violet-50'],
  ['gateway.payment', CreditCard, 'text-sky-700 bg-sky-50'],
  ['gateway.sms', Smartphone, 'text-sky-700 bg-sky-50'],
  ['membership.override', ShieldAlert, 'text-amber-700 bg-amber-50'],
  ['invoice', CreditCard, 'text-emerald-700 bg-emerald-50'],
  ['staff', UserCog, 'text-slate-700 bg-slate-100'],
];
const meta = (action) => ACTION_META.find(([p]) => action.startsWith(p)) || [null, FileClock, 'text-slate-600 bg-slate-100'];

export default function AuditLogsPage() {
  useDocumentTitle('Audit Log');
  const [params, update, raw] = useTableState();
  const { data, isLoading, isFetching } = useAuditLogsQuery(params);
  const [selected, setSelected] = useState(null);

  const columns = [
    { key: 'created_at', header: 'When', sortable: true, render: (r) => <span className="whitespace-nowrap text-xs tabular-nums text-slate-600">{dateTime(r.created_at)}</span> },
    {
      key: 'action', header: 'Action', sortable: true,
      render: (r) => {
        const [, glyph, cls] = meta(r.action);
        return <span className={`inline-flex items-center gap-1.5 rounded px-1.5 py-0.5 font-mono text-2xs font-medium ${cls}`}><Icon icon={glyph} size={11} />{r.action}</span>;
      },
    },
    { key: 'description', header: 'Description', render: (r) => <span className="text-[13px] text-navy-800">{r.description}</span> },
    { key: 'user', header: 'By', render: (r) => r.user?.name ?? <span className="text-slate-400">System</span> },
    { key: 'ip_address', header: 'IP', render: (r) => <span className="font-mono text-2xs text-slate-500">{r.ip_address || '—'}</span> },
  ];

  return (
    <div>
      <PageHeader title="System Audit Log" description="Immutable record of sensitive actions: permission changes, gateway credential updates, manual overrides and approvals." />
      <DataTable
        columns={columns}
        data={data}
        loading={isLoading}
        fetching={isFetching}
        state={raw}
        onChange={update}
        dense
        onRowClick={setSelected}
        searchPlaceholder="Action, description, user, IP…"
        filters={[{
          key: 'action', label: 'Category', options: [
            { value: 'permissions', label: 'Permission updates' }, { value: 'role', label: 'Roles' },
            { value: 'gateway', label: 'Gateway changes' }, { value: 'membership.override', label: 'Manual overrides' },
            { value: 'invoice', label: 'Payment approvals' }, { value: 'staff', label: 'Staff accounts' },
            { value: 'cms', label: 'CMS' }, { value: 'tier', label: 'Tiers' }, { value: 'partner', label: 'Partners' }, { value: 'offer', label: 'Offers' },
          ],
        }]}
        emptyTitle="No audit entries"
      />
      <SlideOverDrawer open={!!selected} onClose={() => setSelected(null)} title={selected?.description} description={selected ? dateTime(selected.created_at) : ''}>
        {selected && (
          <div className="space-y-6">
            <DescriptionList items={[
              ['Action', <code className="text-xs">{selected.action}</code>], ['Performed by', selected.user ? `${selected.user.name} (${selected.user.email})` : 'System'],
              ['Subject', selected.auditable_type ? `${selected.auditable_type} #${selected.auditable_id}` : '—'], ['IP address', selected.ip_address],
            ]} columns={2} />
            <div>
              <p className="eyebrow mb-1">User agent</p>
              <p className="break-all text-xs text-slate-600">{selected.user_agent || '—'}</p>
            </div>
            {selected.properties && (
              <div>
                <p className="eyebrow mb-2 flex items-center gap-1.5"><Icon icon={KeyRound} size={11} /> Change details</p>
                <pre className="max-h-96 overflow-auto rounded-lg border border-slate-200 bg-slate-50 p-3 text-2xs text-slate-700">{JSON.stringify(selected.properties, null, 2)}</pre>
                <p className="mt-2 text-2xs text-slate-500">Secret values are never written to the audit log — only the names of changed credential fields.</p>
              </div>
            )}
          </div>
        )}
      </SlideOverDrawer>
    </div>
  );
}
