import { useEffect, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle2, Clock, XCircle } from 'lucide-react';
import { Button, Icon, Spinner } from '../../components/ui';
import { useMemberInvoicesQuery } from '../../app/api';
import { useDocumentTitle, useT } from '../../hooks';
import { money } from '../../lib/format';
import { baseApi } from '../../app/baseApi';
import { useDispatch } from 'react-redux';

/**
 * Return landing page after a hosted checkout. The webhook is the source of truth,
 * so we poll the member's invoices until this invoice leaves the pending state.
 */
export default function PaymentResultPage() {
  const { t, locale } = useT();
  useDocumentTitle(t('checkout.title'));
  const dispatch = useDispatch();
  const [params] = useSearchParams();
  const number = params.get('invoice');
  const cancelled = params.get('cancelled');

  const { data } = useMemberInvoicesQuery({ per_page: 20 }, { pollingInterval: 3000 });
  const invoice = useMemo(() => data?.data?.find((i) => i.number === number), [data, number]);
  const status = cancelled && invoice?.status !== 'paid' ? 'failed' : invoice?.status;

  useEffect(() => {
    if (status === 'paid') dispatch(baseApi.util.invalidateTags(['Me', 'MemberArea']));
  }, [status, dispatch]);

  const view = {
    paid: [CheckCircle2, 'text-emerald-600', t('checkout.resultPaid'), t('checkout.resultPaidSub')],
    awaiting_approval: [Clock, 'text-amber-600', t('checkout.resultAwaiting'), t('checkout.slipReceived')],
    failed: [XCircle, 'text-rose-600', t('checkout.resultFailed'), t('checkout.resultFailedSub')],
    cancelled: [XCircle, 'text-rose-600', t('checkout.resultFailed'), t('checkout.resultFailedSub')],
  }[status];

  return (
    <div className="mx-auto max-w-md">
      <div className="surface px-6 py-12 text-center">
        {view ? (
          <>
            <Icon icon={view[0]} size={40} className={`mx-auto ${view[1]}`} />
            <h1 className="mt-4 text-xl font-semibold">{view[2]}</h1>
            <p className="mt-2 text-sm text-slate-600">{view[3]}</p>
          </>
        ) : (
          <>
            <Spinner className="mx-auto h-8 w-8" />
            <h1 className="mt-4 text-xl font-semibold">{t('checkout.resultPending')}</h1>
            <p className="mt-2 text-sm text-slate-600">{t('checkout.resultPendingSub')}</p>
          </>
        )}
        {invoice && (
          <p className="mt-6 text-xs text-slate-500">
            <span className="font-mono">{invoice.number}</span> · <span className="tabular-nums">{money(invoice.amount, invoice.currency, locale)}</span>
          </p>
        )}
        <div className="mt-8 flex justify-center gap-2">
          {(status === 'failed' || status === 'cancelled') && (
            <Link to={`/portal/checkout?tier=${invoice?.tier?.id ?? ''}`}><Button variant="secondary">{t('checkout.tryAgain')}</Button></Link>
          )}
          <Link to="/portal"><Button>{t('checkout.viewCard')}</Button></Link>
        </div>
      </div>
    </div>
  );
}
