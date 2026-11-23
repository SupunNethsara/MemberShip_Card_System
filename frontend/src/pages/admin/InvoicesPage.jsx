import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CheckCircle2, ExternalLink, FileText, XCircle } from 'lucide-react';
import {
  Alert, Button, Can, DataTable, DescriptionList, Icon, Modal, PageHeader, SlideOverDrawer, StatCard, StatusBadge, Tabs, Textarea, TierBadge,
} from '../../components/ui';
import { useApproveInvoiceMutation, useInvoiceQuery, useInvoicesQuery, usePaymentGatewaysQuery, useRejectInvoiceMutation, useTransactionsQuery } from '../../app/api';
import { useDocumentTitle, usePermission, useTableState, useToast } from '../../hooks';
import { compactMoney, dateTime, errorMessage, money, number, relative, tr } from '../../lib/format';

export default function InvoicesPage() {
  useDocumentTitle('Payments & Invoices');
  const can = usePermission();
  const [search] = useSearchParams();
  const [tab, setTab] = useState('invoices');
  const [params, update, raw] = useTableState({ status: search.get('status') || undefined });
  const [txParams, txUpdate, txRaw] = useTableState();
  const { data, isLoading, isFetching, refetch } = useInvoicesQuery(params);
  const { data: tx, isLoading: txLoading, isFetching: txFetching, refetch: refetchTx } = useTransactionsQuery(txParams, { skip: tab !== 'transactions' });
  const { data: gateways } = usePaymentGatewaysQuery(undefined, { skip: !can('gateways.payment.view|gateways.payment.manage') });
  const [selected, setSelected] = useState(null);
  const summary = data?.summary;

  const columns = [
    { key: 'number', header: 'Invoice', sortable: true, render: (r) => <span className="font-mono text-xs font-medium text-navy-900">{r.number}</span> },
    { key: 'member', header: 'Member', render: (r) => <div><p className="font-medium text-navy-900">{r.user?.name}</p><p className="font-mono text-2xs text-slate-500">{r.user?.member_code}</p></div> },
    { key: 'tier', header: 'Plan', render: (r) => <div className="flex items-center gap-2"><TierBadge name={tr(r.tier?.name)} color={r.tier?.color} /><span className="text-2xs capitalize text-slate-500">{r.type}</span></div> },
    { key: 'gateway', header: 'Gateway', render: (r) => r.gateway?.name ?? '—' },
    { key: 'amount', header: 'Amount', align: 'right', sortable: true, render: (r) => <span className="font-medium text-navy-900">{money(r.amount, r.currency)}</span> },
    { key: 'status', header: 'Status', sortable: true, render: (r) => <StatusBadge status={r.status} /> },
    { key: 'created_at', header: 'Created', sortable: true, render: (r) => <span className="text-xs text-slate-500">{relative(r.created_at)}</span> },
  ];

  const txColumns = [
    { key: 'created_at', header: 'Time', sortable: true, render: (r) => <span className="text-xs tabular-nums text-slate-600">{dateTime(r.created_at)}</span> },
    { key: 'invoice', header: 'Invoice', render: (r) => <span className="font-mono text-xs">{r.invoice?.number}</span> },
    { key: 'driver', header: 'Gateway', render: (r) => <span className="capitalize">{r.gateway?.name ?? r.driver}</span> },
    { key: 'direction', header: 'Event', render: (r) => <span className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-2xs text-slate-700">{r.direction}</span> },
    { key: 'reference', header: 'Reference', render: (r) => <span className="font-mono text-2xs text-slate-500">{r.reference || '—'}</span> },
    { key: 'status', header: 'Result', sortable: true, render: (r) => <StatusBadge status={r.status} /> },
    { key: 'message', header: 'Message', render: (r) => <span className="text-xs text-slate-500">{r.message || '—'}</span> },
  ];

  return (
    <div>
      <PageHeader title="Payments & Invoices" description="Every checkout, webhook and manual approval, with raw gateway payloads." />
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Collected (all time)" value={compactMoney(summary?.paid_total)} accent="emerald" loading={isLoading} />
        <StatCard label="Awaiting slip approval" value={number(summary?.awaiting_approval)} accent="amber" loading={isLoading} />
        <StatCard label="Open checkouts" value={number(summary?.pending)} loading={isLoading} />
      </div>
      <Tabs className="mb-4" value={tab} onChange={setTab} tabs={[{ value: 'invoices', label: 'Invoices' }, { value: 'transactions', label: 'Gateway transactions' }]} />
      {tab === 'invoices' ? (
        <DataTable
          columns={columns}
          data={data}
          onRetry={refetch}
          loading={isLoading}
          fetching={isFetching}
          state={raw}
          onChange={update}
          onRowClick={(r) => setSelected(r.id)}
          searchPlaceholder="Invoice no., member name, email, ID…"
          filters={[
            { key: 'status', label: 'Status', options: ['paid', 'awaiting_approval', 'pending', 'failed', 'cancelled'].map((s) => ({ value: s, label: s.replace('_', ' ').replace(/^\w/, (c) => c.toUpperCase()) })) },
            ...(gateways?.data ? [{ key: 'gateway', label: 'Gateway', options: gateways.data.map((g) => ({ value: g.id, label: g.name })) }] : []),
          ]}
          emptyTitle="No invoices match"
        />
      ) : (
        <DataTable
          columns={txColumns}
          data={tx}
          onRetry={refetchTx}
          loading={txLoading}
          fetching={txFetching}
          state={txRaw}
          onChange={txUpdate}
          dense
          searchPlaceholder="Reference or invoice no…"
          filters={[{ key: 'status', label: 'Result', options: ['success', 'initiated', 'pending', 'failed', 'invalid_signature'].map((s) => ({ value: s, label: s.replace('_', ' ') })) }]}
        />
      )}
      <InvoiceDrawer id={selected} onClose={() => setSelected(null)} />
    </div>
  );
}

function InvoiceDrawer({ id, onClose }) {
  const toast = useToast();
  const { data: inv } = useInvoiceQuery(id, { skip: !id });
  const [approve, { isLoading: approving }] = useApproveInvoiceMutation();
  const [reject, { isLoading: rejecting }] = useRejectInvoiceMutation();
  const [rejectOpen, setRejectOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [payloadOpen, setPayloadOpen] = useState(null);

  const doApprove = async () => {
    try { await approve({ id }).unwrap(); toast('Payment approved', 'success', 'Membership activated and SMS receipt sent.'); } catch (e) { toast(errorMessage(e), 'error'); }
  };
  const doReject = async () => {
    try { await reject({ id, reason }).unwrap(); toast('Payment rejected', 'warning'); setRejectOpen(false); setReason(''); } catch (e) { toast(errorMessage(e), 'error'); }
  };

  const canAct = inv && ['awaiting_approval', 'pending', 'failed'].includes(inv.status);
  const isImage = inv?.slip_url && /\.(png|jpe?g|webp)$/i.test(inv.slip_url);

  return (
    <SlideOverDrawer
      open={!!id}
      onClose={onClose}
      title={inv?.number ?? 'Invoice'}
      description={inv ? `${inv.user?.name} · ${money(inv.amount, inv.currency)}` : ''}
      headerExtra={inv && <StatusBadge status={inv.status} />}
      footer={canAct && (
        <Can perform="payments.manage">
          <Button variant="secondary" size="sm" icon={XCircle} onClick={() => setRejectOpen(true)}>Reject</Button>
          <Button variant="success" size="sm" icon={CheckCircle2} loading={approving} onClick={doApprove}>Approve & activate</Button>
        </Can>
      )}
    >
      {!inv ? <p className="text-sm text-slate-500">Loading…</p> : (
        <div className="space-y-6">
          {inv.status === 'awaiting_approval' && <Alert tone="warning" title="Bank slip awaiting verification">Check the slip against your bank statement before approving.</Alert>}
          {inv.notes && <Alert tone="info">{inv.notes}</Alert>}
          <DescriptionList items={[
            ['Member', <span>{inv.user?.name}<br /><span className="text-xs text-slate-500">{inv.user?.email} · {inv.user?.phone}</span></span>],
            ['Member ID', <span className="font-mono">{inv.user?.member_code}</span>],
            ['Plan', <TierBadge name={tr(inv.tier?.name)} color={inv.tier?.color} />],
            ['Type', <span className="capitalize">{inv.type}</span>],
            ['Gateway', inv.gateway?.name],
            ['Amount', <span className="font-semibold tabular-nums">{money(inv.amount, inv.currency)}</span>],
            ['Created', dateTime(inv.created_at)],
            ['Paid', inv.paid_at ? dateTime(inv.paid_at) : '—'],
            inv.membership && ['Membership valid until', dateTime(inv.membership.expires_at)],
          ]} />

          {inv.slip_url && (
            <div>
              <p className="eyebrow mb-2">Deposit slip</p>
              {isImage ? (
                <a href={inv.slip_url} target="_blank" rel="noreferrer" className="block overflow-hidden rounded-lg border border-slate-200">
                  <img src={inv.slip_url} alt="Deposit slip" className="max-h-80 w-full bg-slate-50 object-contain" />
                </a>
              ) : (
                <a href={inv.slip_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-sm font-medium hover:bg-slate-50">
                  <Icon icon={FileText} size={15} /> Open slip <Icon icon={ExternalLink} size={13} />
                </a>
              )}
            </div>
          )}

          <div>
            <p className="eyebrow mb-2">Transaction log</p>
            <ol className="relative space-y-3 border-l border-slate-200 pl-5">
              {(inv.transactions || []).map((t) => (
                <li key={t.id} className="relative">
                  <span className={`absolute -left-[25px] top-1 h-2.5 w-2.5 rounded-full ring-4 ring-white ${t.status === 'success' ? 'bg-emerald-500' : t.status === 'failed' || t.status === 'invalid_signature' ? 'bg-rose-500' : 'bg-amber-500'}`} />
                  <div className="flex flex-wrap items-center gap-2 text-sm">
                    <span className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-2xs">{t.direction}</span>
                    <StatusBadge status={t.status} />
                    <span className="text-xs tabular-nums text-slate-500">{dateTime(t.created_at)}</span>
                  </div>
                  {t.message && <p className="mt-1 text-xs text-slate-600">{t.message}</p>}
                  {t.payload && Object.keys(t.payload).length > 0 && (
                    <button className="mt-1 text-2xs font-medium text-slate-500 underline-offset-2 hover:text-navy-900 hover:underline" onClick={() => setPayloadOpen(payloadOpen === t.id ? null : t.id)}>
                      {payloadOpen === t.id ? 'Hide' : 'View'} raw payload
                    </button>
                  )}
                  {payloadOpen === t.id && <pre className="mt-2 max-h-60 overflow-auto rounded-md border border-slate-200 bg-slate-50 p-3 text-2xs text-slate-700">{JSON.stringify(t.payload, null, 2)}</pre>}
                </li>
              ))}
            </ol>
          </div>
        </div>
      )}
      <Modal open={rejectOpen} onClose={() => setRejectOpen(false)} size="sm" title="Reject payment" footer={<><Button variant="secondary" size="sm" onClick={() => setRejectOpen(false)}>Cancel</Button><Button variant="danger" size="sm" loading={rejecting} disabled={!reason.trim()} onClick={doReject}>Reject payment</Button></>}>
        <Textarea label="Reason (visible to finance & audit log)" rows={3} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Amount on slip does not match invoice" />
      </Modal>
    </SlideOverDrawer>
  );
}
