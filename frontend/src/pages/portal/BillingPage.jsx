import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Download, Receipt, Upload } from 'lucide-react';
import { Button, DataTable, PageHeader, StatusBadge, TierBadge } from '../../components/ui';
import SlipUploadModal from './SlipUploadModal';
import { useMemberInvoicesQuery } from '../../app/api';
import { useDocumentTitle, useT, useToast } from '../../hooks';
import { date, money } from '../../lib/format';
import { downloadAuthenticated } from '../../lib/download';

export default function BillingPage() {
  const { t, tr, locale } = useT();
  useDocumentTitle(t('portal.billingTitle'));
  const toast = useToast();
  const [state, setState] = useState({ page: 1, per_page: 10 });
  const [slipFor, setSlipFor] = useState(null);
  const [downloading, setDownloading] = useState(null);
  const { data, isLoading, isFetching, refetch } = useMemberInvoicesQuery(state);

  const download = async (inv) => {
    setDownloading(inv.id);
    try {
      await downloadAuthenticated(`/member/invoices/${inv.id}/receipt`, `receipt-${inv.number}.html`);
    } catch (e) {
      toast(e.message, 'error');
    } finally {
      setDownloading(null);
    }
  };

  const columns = [
    { key: 'number', header: t('portal.invoice'), render: (r) => <span className="font-mono text-xs font-medium text-navy-900">{r.number}</span> },
    { key: 'tier', header: t('portal.tier'), render: (r) => <div className="flex items-center gap-2"><TierBadge name={tr(r.tier?.name)} color={r.tier?.color} /><span className="text-xs text-slate-500">{t(`checkout.${r.type === 'new' ? 'newPlan' : r.type}`)}</span></div> },
    { key: 'created_at', header: t('portal.date'), render: (r) => <span className="tabular-nums">{date(r.paid_at || r.created_at, locale)}</span> },
    { key: 'gateway', header: t('portal.method'), render: (r) => r.gateway?.name ?? '—' },
    { key: 'amount', header: t('portal.amount'), align: 'right', render: (r) => <span className="font-medium text-navy-900">{money(r.amount, r.currency, locale)}</span> },
    { key: 'status', header: t('portal.status'), render: (r) => <StatusBadge status={r.status}>{t(`status.${r.status}`)}</StatusBadge> },
    {
      key: 'actions', header: '', align: 'right',
      render: (r) =>
        r.status === 'paid' ? (
          <Button size="xs" variant="secondary" icon={Download} loading={downloading === r.id} onClick={() => download(r)}>{t('portal.receipt')}</Button>
        ) : r.gateway?.driver === 'manual' && ['pending', 'failed'].includes(r.status) ? (
          <Button size="xs" icon={Upload} onClick={() => setSlipFor(r)}>{t('portal.uploadSlip')}</Button>
        ) : r.status === 'failed' || r.status === 'cancelled' ? (
          <Link to={`/portal/checkout?tier=${r.tier?.id}`}><Button size="xs" variant="ghost">{t('checkout.tryAgain')}</Button></Link>
        ) : null,
    },
  ];

  return (
    <div>
      <PageHeader title={t('portal.billingTitle')} description={t('portal.billingSub')} actions={<Link to="/portal/checkout"><Button icon={Receipt}>{t('portal.choosePlan')}</Button></Link>} />
      <DataTable
        columns={columns}
        data={data}
        onRetry={refetch}
        loading={isLoading}
        fetching={isFetching}
        state={state}
        onChange={(p) => setState((s) => ({ ...s, ...p }))}
        searchable={false}
        emptyTitle="No invoices yet"
      />
      <SlipUploadModal invoice={slipFor} onClose={() => setSlipFor(null)} />
    </div>
  );
}
