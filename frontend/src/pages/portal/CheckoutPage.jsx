import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Building2, Check, CreditCard, Globe, Landmark, Lock, ShieldCheck } from 'lucide-react';
import { Alert, Button, Card, Icon, Skeleton, Spinner } from '../../components/ui';
import { SlipDropzone } from './SlipUploadModal';
import { useCheckoutMutation, usePublicGatewaysQuery, usePublicTiersQuery, useUploadSlipMutation } from '../../app/api';
import { useDocumentTitle, useT, useToast } from '../../hooks';
import { duration, errorMessage, money } from '../../lib/format';

const DRIVER_ICON = { payhere: CreditCard, stripe: Globe, webxpay: Building2, manual: Landmark };

/** Submits a hidden auto-POST form (PayHere / WebXPay hosted checkout). */
function postForm(url, fields) {
  const form = document.createElement('form');
  form.method = 'POST';
  form.action = url;
  Object.entries(fields).forEach(([k, v]) => {
    const input = document.createElement('input');
    input.type = 'hidden';
    input.name = k;
    input.value = v ?? '';
    form.appendChild(input);
  });
  document.body.appendChild(form);
  form.submit();
}

export default function CheckoutPage() {
  const { t, tr, locale } = useT();
  useDocumentTitle(t('checkout.title'));
  const navigate = useNavigate();
  const toast = useToast();
  const [params] = useSearchParams();
  const user = useSelector((s) => s.auth.user);
  const { data: tiers = [], isLoading: tiersLoading } = usePublicTiersQuery();
  const { data: gateways = [], isLoading: gwLoading } = usePublicGatewaysQuery();
  const [checkout, { isLoading: paying, error }] = useCheckoutMutation();
  const [uploadSlip, { isLoading: uploading, error: slipError }] = useUploadSlipMutation();

  const [tierId, setTierId] = useState(Number(params.get('tier')) || null);
  const [gatewayId, setGatewayId] = useState(null);
  const [manual, setManual] = useState(null); // { invoice, instructions }
  const [redirecting, setRedirecting] = useState(false);
  const [file, setFile] = useState(null);

  useEffect(() => {
    if (!tierId && tiers.length) setTierId((tiers.find((x) => x.is_featured) || tiers[0]).id);
  }, [tiers, tierId]);
  useEffect(() => {
    if (!gatewayId && gateways.length) setGatewayId((gateways.find((g) => g.is_default) || gateways[0]).id);
  }, [gateways, gatewayId]);

  const tier = tiers.find((x) => x.id === tierId);
  const current = user?.active_membership;
  const purchaseType = useMemo(() => {
    if (!current || current.status !== 'active') return 'newPlan';
    return current.tier?.id === tierId ? 'renewal' : 'upgrade';
  }, [current, tierId]);

  const pay = async () => {
    try {
      const res = await checkout({ tier_id: tierId, gateway_id: gatewayId }).unwrap();
      const { action, invoice } = res;
      if (action.type === 'redirect') {
        setRedirecting(true);
        window.location.assign(action.url);
      } else if (action.type === 'form') {
        setRedirecting(true);
        postForm(action.url, action.fields);
      } else {
        setManual({ invoice: invoice.data ?? invoice, instructions: action.instructions });
      }
    } catch { /* error rendered */ }
  };

  const submitSlip = async () => {
    try {
      await uploadSlip({ id: manual.invoice.id, file }).unwrap();
      toast(t('checkout.slipReceived'));
      navigate(`/portal/payment/result?invoice=${manual.invoice.number}`);
    } catch { /* shown */ }
  };

  if (redirecting) {
    return (
      <div className="surface flex flex-col items-center gap-3 px-6 py-20 text-center">
        <Spinner className="h-6 w-6" />
        <p className="text-sm font-medium">{t('checkout.redirecting')}</p>
      </div>
    );
  }

  if (manual) {
    const ins = manual.instructions || {};
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <h1 className="text-2xl font-semibold">{t('checkout.bankTitle')}</h1>
        <Alert tone="info">{t('checkout.bankHint')}</Alert>
        <Card bodyClass="p-0">
          <dl className="divide-y divide-slate-100 text-sm">
            {[
              ['Bank', ins.bank_name], ['Account name', ins.account_name], ['Account number', ins.account_number],
              ['Branch', ins.branch], ['SWIFT', ins.swift],
            ].filter(([, v]) => v).map(([k, v]) => (
              <div key={k} className="flex items-center justify-between gap-4 px-5 py-3">
                <dt className="text-slate-500">{k}</dt>
                <dd className="font-medium tabular-nums text-navy-900">{v}</dd>
              </div>
            ))}
            <div className="flex items-center justify-between gap-4 bg-slate-50 px-5 py-3">
              <dt className="text-slate-500">{t('checkout.reference')}</dt>
              <dd className="font-mono font-semibold text-navy-900">{ins.reference}</dd>
            </div>
            <div className="flex items-center justify-between gap-4 px-5 py-4">
              <dt className="font-medium text-slate-700">{t('checkout.total')}</dt>
              <dd className="font-display text-xl font-semibold tabular-nums">{money(ins.amount, ins.currency, locale)}</dd>
            </div>
          </dl>
          {ins.instructions && <p className="border-t border-slate-100 px-5 py-3 text-xs text-slate-500">{ins.instructions}</p>}
        </Card>
        <Card title={t('portal.uploadSlip')}>
          {slipError && <Alert tone="danger" className="mb-4">{errorMessage(slipError)}</Alert>}
          <SlipDropzone file={file} onFile={setFile} />
          <div className="mt-4 flex justify-between">
            <Button variant="ghost" onClick={() => navigate('/portal/billing')}>{t('portal.nav.billing')}</Button>
            <Button disabled={!file} loading={uploading} onClick={submitSlip}>{t('checkout.submitSlip')}</Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold">{t('checkout.title')}</h1>
      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          <section>
            <p className="eyebrow mb-3">1 · {t('checkout.step1')}</p>
            <div className="grid gap-3 sm:grid-cols-3">
              {tiersLoading && [0, 1, 2].map((i) => <Skeleton key={i} className="h-28 rounded-lg" />)}
              {tiers.map((x) => {
                const sel = x.id === tierId;
                return (
                  <button
                    key={x.id}
                    type="button"
                    onClick={() => setTierId(x.id)}
                    className={`relative rounded-lg border bg-white p-4 text-left transition-colors ${sel ? 'border-navy-900 ring-1 ring-navy-900' : 'border-slate-200 hover:border-slate-300'}`}
                  >
                    {sel && <span className="absolute right-3 top-3 inline-flex h-5 w-5 items-center justify-center rounded-full bg-navy-900 text-white"><Icon icon={Check} size={12} /></span>}
                    <span className="flex items-center gap-2 text-sm font-semibold"><span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: x.color }} />{tr(x.name)}</span>
                    <p className="mt-3 font-display text-lg font-semibold tabular-nums">{money(x.price, 'LKR', locale)}</p>
                    <p className="text-xs text-slate-500">{duration(x.duration_value, x.duration_unit, t)} · {x.offers_count} {t('home.offersIncluded').toLowerCase()}</p>
                  </button>
                );
              })}
            </div>
          </section>

          <section>
            <p className="eyebrow mb-3">2 · {t('checkout.step2')}</p>
            {gwLoading ? (
              <Skeleton className="h-32 rounded-lg" />
            ) : gateways.length === 0 ? (
              <Alert tone="warning">{t('checkout.noGateways')}</Alert>
            ) : (
              <div className="surface divide-y divide-slate-100">
                {gateways.map((g) => {
                  const sel = g.id === gatewayId;
                  return (
                    <label key={g.id} className={`flex cursor-pointer items-center gap-3 px-4 py-3.5 ${sel ? 'bg-slate-50' : 'hover:bg-slate-50/60'}`}>
                      <input type="radio" name="gateway" className="sr-only" checked={sel} onChange={() => setGatewayId(g.id)} />
                      <span className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${sel ? 'border-navy-900' : 'border-slate-300'}`}>
                        {sel && <span className="h-2 w-2 rounded-full bg-navy-900" />}
                      </span>
                      <span className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-700">
                        <Icon icon={DRIVER_ICON[g.driver] || CreditCard} size={15} />
                      </span>
                      <span className="flex-1 text-sm font-medium text-navy-900">{tr(g.name)}</span>
                      {g.mode === 'sandbox' && <span className="rounded bg-amber-50 px-1.5 py-0.5 text-2xs font-medium text-amber-700">Sandbox</span>}
                    </label>
                  );
                })}
              </div>
            )}
          </section>
        </div>

        <aside>
          <Card title={t('checkout.summary')} className="lg:sticky lg:top-24">
            {tier ? (
              <>
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 font-medium"><span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: tier.color }} />{tr(tier.name)}</span>
                  <span className="tabular-nums">{money(tier.price, 'LKR', locale)}</span>
                </div>
                <p className="mt-1 text-xs text-slate-500">{t(`checkout.${purchaseType}`)} · {duration(tier.duration_value, tier.duration_unit, t)}</p>
                <div className="mt-4 flex items-center justify-between border-t border-slate-200 pt-4">
                  <span className="text-sm font-medium">{t('checkout.total')}</span>
                  <span className="font-display text-xl font-semibold tabular-nums">{money(tier.price, 'LKR', locale)}</span>
                </div>
              </>
            ) : <Skeleton className="h-20" />}
            {error && <Alert tone="danger" className="mt-4">{errorMessage(error)}</Alert>}
            <Button size="lg" className="mt-5 w-full justify-center" icon={Lock} loading={paying} disabled={!tierId || !gatewayId} onClick={pay}>
              {t('checkout.pay')}
            </Button>
            <p className="mt-3 flex items-center justify-center gap-1.5 text-2xs text-slate-500"><Icon icon={ShieldCheck} size={12} /> 256-bit TLS · PCI-DSS gateways</p>
          </Card>
        </aside>
      </div>
    </div>
  );
}
