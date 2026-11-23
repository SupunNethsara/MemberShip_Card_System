import { useMemo, useState } from 'react';
import { CheckCheck, Clock, History, IdCard, PackageCheck, Printer, RotateCcw, X } from 'lucide-react';
import {
  Avatar, Button, Can, Checkbox, DataTable, Icon, Input, Modal, PageHeader, SlideOverDrawer, StatCard, StatusBadge, Tabs, TierBadge,
} from '../../components/ui';
import CardPrintModal from './cards/CardPrintModal';
import { useMarkCardsIssuedMutation, useMemberCardLogsQuery, useMemberCardsQuery, useTiersQuery } from '../../app/api';
import { useDocumentTitle, usePermission, useTableState, useToast } from '../../hooks';
import { date, dateTime, errorMessage, number, tr } from '../../lib/format';

const REASON = { new: 'New member', renewed: 'Renewed', upgraded: 'Upgraded', override: 'Manual override', reprint_requested: 'Reprint requested' };

export default function CardsPage() {
  useDocumentTitle('Member Cards');
  const can = usePermission();
  const toast = useToast();
  const [params, update, raw] = useTableState({ status: 'pending', sort: 'created_at', direction: 'desc' });
  const { data, isLoading, isFetching, refetch } = useMemberCardsQuery(params);
  const { data: tiers } = useTiersQuery({ per_page: 100 });
  const [markIssued, { isLoading: issuing }] = useMarkCardsIssuedMutation();
  const [selected, setSelected] = useState(() => new Set());
  const [printIds, setPrintIds] = useState(null);
  const [issueIds, setIssueIds] = useState(null);
  const [issueNote, setIssueNote] = useState('');
  const [historyFor, setHistoryFor] = useState(null);
  const rows = data?.data ?? [];
  const counts = data?.counts ?? {};

  const pageIds = rows.map((r) => r.user_id);
  const allOnPage = pageIds.length > 0 && pageIds.every((id) => selected.has(id));
  const someOnPage = pageIds.some((id) => selected.has(id));
  const selectedRows = useMemo(() => rows.filter((r) => selected.has(r.user_id)), [rows, selected]);
  const selectedPrinted = selectedRows.length > 0 && selectedRows.every((r) => r.card.card_status === 'printed');

  const toggle = (id) => setSelected((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const togglePage = () => setSelected((s) => { const n = new Set(s); allOnPage ? pageIds.forEach((id) => n.delete(id)) : pageIds.forEach((id) => n.add(id)); return n; });
  const changeTab = (status) => { setSelected(new Set()); update({ status: status === 'all' ? undefined : status }); };

  const confirmIssue = async () => {
    try {
      const res = await markIssued({ userIds: issueIds, note: issueNote || undefined }).unwrap();
      toast(res.message);
      setSelected(new Set());
      setIssueIds(null);
      setIssueNote('');
    } catch (e) { toast(errorMessage(e), 'error'); }
  };

  const columns = [
    {
      key: 'select', width: 44,
      header: <Checkbox size="sm" checked={allOnPage} indeterminate={!allOnPage && someOnPage} onChange={togglePage} title="Select all on this page" />,
      render: (r) => <div onClick={(e) => e.stopPropagation()}><Checkbox size="sm" checked={selected.has(r.user_id)} onChange={() => toggle(r.user_id)} /></div>,
    },
    {
      key: 'name', header: 'Member', sortable: true,
      render: (r) => (
        <div className="flex items-center gap-3">
          <Avatar name={r.name} size={36} />
          <div className="min-w-0">
            <p className="truncate font-medium text-navy-900">{r.name}</p>
            <p className="truncate text-xs text-slate-500">{r.phone || r.email}</p>
          </div>
        </div>
      ),
    },
    { key: 'member_code', header: 'Member ID', sortable: true, headerClass: 'whitespace-nowrap', render: (r) => <span className="whitespace-nowrap font-mono text-xs">{r.member_code}</span> },
    { key: 'nic', header: 'NIC', render: (r) => (r.nic ? <span className="font-mono text-xs">{r.nic}</span> : <span className="text-xs text-slate-400">—</span>) },
    { key: 'tier', header: 'Tier', render: (r) => (r.tier ? <TierBadge name={tr(r.tier.name)} color={r.tier.color} /> : '—') },
    {
      key: 'status', header: 'Card status',
      render: (r) => (
        <div className="flex flex-col items-start gap-0.5">
          <StatusBadge status={r.card.card_status}>{r.card.card_status === 'pending' ? (r.card.is_reprint ? 'Reprint due' : 'Pending print') : undefined}</StatusBadge>
          {r.card.card_status === 'pending' && r.card.pending_reason && <span className="text-2xs text-slate-400">{REASON[r.card.pending_reason] ?? r.card.pending_reason}</span>}
        </div>
      ),
    },
    {
      key: 'printed', header: 'Printed / issued',
      render: (r) => {
        const c = r.card;
        if (!c.card_printed_at) return <span className="text-xs text-slate-400">Never printed</span>;
        return (
          <div className="whitespace-nowrap text-xs leading-snug">
            <p className="text-slate-700" title={`${dateTime(c.card_printed_at)} · ${c.card_printed_by ?? ''}`}>Printed {date(c.card_printed_at)}</p>
            {c.issued_at
              ? <p className="text-emerald-700" title={`${dateTime(c.issued_at)} · ${c.issued_by ?? ''}`}>Issued {date(c.issued_at)}</p>
              : <p className="text-slate-400">by {(c.card_printed_by ?? '—').split(' ')[0]}</p>}
          </div>
        );
      },
    },
    { key: 'reprints', header: 'Reprints', align: 'right', render: (r) => <span className={r.card.reprint_count ? 'font-semibold text-amber-700' : 'text-slate-400'}>{r.card.reprint_count}</span> },
    {
      key: 'actions', header: '', align: 'right',
      render: (r) => (
        <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
          <Can perform="cards.print">
            <Button size="xs" variant={r.card.is_reprint ? 'secondary' : 'primary'} icon={r.card.is_reprint ? RotateCcw : Printer} onClick={() => setPrintIds([r.user_id])}>
              {r.card.is_reprint ? 'Reprint' : 'Preview & print'}
            </Button>
          </Can>
          {r.card.card_status === 'printed' && (
            <Can perform="cards.issue"><Button size="xs" variant="success" icon={PackageCheck} onClick={() => setIssueIds([r.user_id])}>Issue</Button></Can>
          )}
          <Button size="icon" variant="ghost" onClick={() => setHistoryFor(r)} aria-label="Card history" title="Card history"><Icon icon={History} size={14} /></Button>
        </div>
      ),
    },
  ];

  const tab = raw.status ?? 'all';

  return (
    <div>
      <PageHeader
        eyebrow="Membership"
        title="Member Cards"
        description="Print queue for physical PVC cards. Only members with an active account and a current membership are listed."
      />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Pending print" value={number(counts.pending)} icon={Clock} accent="amber" loading={isLoading} />
        <StatCard label="Printed — awaiting issue" value={number(counts.printed)} icon={Printer} loading={isLoading} />
        <StatCard label="Issued to members" value={number(counts.issued)} icon={PackageCheck} accent="emerald" loading={isLoading} />
      </div>

      <Tabs className="mb-4" value={tab} onChange={changeTab} tabs={[
        { value: 'pending', label: 'Pending print', count: counts.pending },
        { value: 'printed', label: 'Printed', count: counts.printed },
        { value: 'issued', label: 'Issued', count: counts.issued },
        { value: 'all', label: 'All active members', count: counts.all },
      ]} />

      {selected.size > 0 && (
        <div className="mb-3 flex flex-wrap items-center gap-2 rounded-lg border border-navy-200 bg-navy-50 px-4 py-2.5">
          <span className="text-sm font-medium text-navy-900"><span className="tabular-nums">{selected.size}</span> selected</span>
          <div className="ml-auto flex flex-wrap gap-2">
            <Can perform="cards.print"><Button size="sm" icon={Printer} onClick={() => setPrintIds([...selected])}>Bulk print selected ({selected.size})</Button></Can>
            {selectedPrinted && selectedRows.length === selected.size && (
              <Can perform="cards.issue"><Button size="sm" variant="success" icon={CheckCheck} onClick={() => setIssueIds([...selected])}>Mark issued ({selected.size})</Button></Can>
            )}
            <Button size="sm" variant="ghost" icon={X} onClick={() => setSelected(new Set())}>Clear</Button>
          </div>
        </div>
      )}

      <DataTable
        columns={columns}
        data={data}
        onRetry={refetch}
        loading={isLoading}
        fetching={isFetching}
        state={raw}
        onChange={update}
        rowKey="user_id"
        onRowClick={(r) => toggle(r.user_id)}
        searchPlaceholder="Name, member ID, NIC or mobile…"
        filters={[
          { key: 'tier', label: 'Tier', options: (tiers?.data || []).map((t) => ({ value: t.id, label: tr(t.name) })) },
        ]}
        emptyTitle={tab === 'pending' ? 'No cards waiting to be printed' : 'No cards here'}
        emptyDescription={tab === 'pending' ? 'New and renewed memberships appear here automatically.' : undefined}
      />

      <CardPrintModal open={!!printIds} userIds={printIds} onClose={() => setPrintIds(null)} onPrinted={() => setSelected(new Set())} />

      <Modal
        open={!!issueIds}
        onClose={() => setIssueIds(null)}
        size="sm"
        title={`Mark ${issueIds?.length ?? 0} card${issueIds?.length > 1 ? 's' : ''} as issued`}
        description="Confirms the physical card was handed over to the member."
        footer={<><Button variant="secondary" size="sm" onClick={() => setIssueIds(null)}>Cancel</Button><Button variant="success" size="sm" icon={PackageCheck} loading={issuing} onClick={confirmIssue}>Mark issued</Button></>}
      >
        <Input label="Note (optional)" placeholder="e.g. Collected at Colombo office, ID checked" value={issueNote} onChange={(e) => setIssueNote(e.target.value)} />
      </Modal>

      <CardHistoryDrawer member={historyFor} onClose={() => setHistoryFor(null)} />
    </div>
  );
}

const ACTION = {
  queued: ['Queued for printing', 'bg-amber-500'],
  printed: ['Printed', 'bg-sky-500'],
  reprinted: ['Reprinted', 'bg-amber-600'],
  issued: ['Issued to member', 'bg-emerald-500'],
};

function CardHistoryDrawer({ member, onClose }) {
  const { data, isFetching } = useMemberCardLogsQuery(member?.user_id, { skip: !member });
  return (
    <SlideOverDrawer open={!!member} onClose={onClose} title={member ? `Card history — ${member.name}` : ''} description={member?.member_code} size="md">
      {isFetching && !data ? <p className="text-sm text-slate-500">Loading…</p> : (
        <div className="space-y-5">
          {data?.card && (
            <div className="grid grid-cols-3 gap-3">
              <div className="surface p-3"><p className="eyebrow">Status</p><div className="mt-1.5"><StatusBadge status={data.card.card_status} /></div></div>
              <div className="surface p-3"><p className="eyebrow">Reprints</p><p className="mt-1 text-lg font-semibold tabular-nums">{data.card.reprint_count}</p></div>
              <div className="surface p-3"><p className="eyebrow">Last print</p><p className="mt-1 text-xs">{data.card.card_printed_at ? date(data.card.card_printed_at) : '—'}</p></div>
            </div>
          )}
          <ol className="relative space-y-4 border-l border-slate-200 pl-5">
            {(data?.logs ?? []).map((l) => (
              <li key={l.id} className="relative">
                <span className={`absolute -left-[25px] top-1 h-2.5 w-2.5 rounded-full ring-4 ring-white ${ACTION[l.action]?.[1] ?? 'bg-slate-400'}`} />
                <p className="text-sm font-medium text-navy-900">{ACTION[l.action]?.[0] ?? l.action}</p>
                <p className="text-xs text-slate-500">{dateTime(l.created_at)} · {l.by ?? 'System'}{l.batch_ref && <> · batch <span className="font-mono">{l.batch_ref}</span></>}</p>
                {l.snapshot && <p className="mt-0.5 text-2xs text-slate-400">Printed: {l.snapshot.tier} · valid to {l.snapshot.expires_at}</p>}
                {l.note && <p className="mt-0.5 text-xs text-slate-600">{l.note}</p>}
              </li>
            ))}
            {!data?.logs?.length && <li className="text-sm text-slate-400"><Icon icon={IdCard} size={14} className="mr-1 inline" />No card activity yet.</li>}
          </ol>
        </div>
      )}
    </SlideOverDrawer>
  );
}
