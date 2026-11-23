import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { ArrowRight, BadgePercent, Check, ChevronDown, CreditCard, Layers3, Lock, QrCode, ShieldCheck, Star } from 'lucide-react';
import { Button, Icon, LoadError, Skeleton } from '../../components/ui';
import HeroSlider from '../../components/home/HeroSlider';
import PartnerCard from '../../components/public/PartnerCard';
import { usePublicContentQuery, usePublicPartnersQuery, usePublicTiersQuery } from '../../app/api';
import { useDocumentTitle, useT } from '../../hooks';
import { duration, money, number, offerValue } from '../../lib/format';

/** "How it works" steps. `key` matches the CMS description (how.step1…) and the built-in title (home.how.step1…). */
const HOW_STEPS = [
  { key: 'step1', icon: Layers3, badge: Star },
  { key: 'step2', icon: CreditCard, badge: ShieldCheck },
  { key: 'step3', icon: QrCode, badge: BadgePercent },
];

/** Large line-drawn icon with a small gold badge on its corner (e.g. card + shield = pay securely). */
function StepIcon({ main, badge }) {
  return (
    <span className="relative inline-flex h-20 w-20 items-center justify-center" aria-hidden="true">
      <Icon icon={main} size={64} strokeWidth={1.25} className="text-navy-900" />
      <span className="absolute -bottom-1 -right-2 inline-flex h-9 w-9 items-center justify-center rounded-full bg-navy-50">
        <Icon icon={badge} size={30} strokeWidth={1.5} className="text-gold-500" />
      </span>
    </span>
  );
}

export default function HomePage() {
  const { t, tr, locale } = useT();
  const navigate = useNavigate();
  const user = useSelector((s) => s.auth.user);
  const { data: content, isLoading: contentLoading, isError: contentError, refetch: refetchContent } = usePublicContentQuery();
  const { data: tiers = [], isLoading: tiersLoading, isError: tiersError, refetch: refetchTiers } = usePublicTiersQuery();
  const { data: partners, isLoading: partnersLoading, isError: partnersError, refetch: refetchPartners } = usePublicPartnersQuery({ per_page: 48 });
  const faqs = content?.faqs?.data ?? content?.faqs ?? [];
  const [viewTierId, setViewTierId] = useState(null);
  const [openFaq, setOpenFaq] = useState(0);
  const c = content?.content || {};
  useDocumentTitle('Home');

  const featured = tiers.find((x) => x.is_featured) || tiers[1] || tiers[0];
  const viewTier = tiers.find((x) => x.id === viewTierId) || featured;

  const choose = (tier) => {
    if (user && !user.is_staff) navigate(`/portal/checkout?tier=${tier.id}`);
    else navigate(`/register?tier=${tier.id}`);
  };

  // Comparison rows: every live offer, ticked per tier.
  const offerRows = useMemo(
    () => (partners?.data || []).flatMap((p) => (p.offers || []).map((o) => ({ ...o, partnerName: p.name }))),
    [partners]
  );

  return (
    <div>
      {/* Hero — slide 1 is built in; slides from Admin › CMS › Hero slides follow it. */}
      <HeroSlider
        slides={content?.hero_slides?.data ?? content?.hero_slides ?? []}
        stats={content?.stats}
        statsStatus={contentLoading ? 'loading' : contentError ? 'error' : 'ready'}
      />

      {/* How it works */}
      {/* How it works — icons and titles are built in (always shown); the one-line descriptions come from CMS › Page content. */}
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-16">
          <h2 className="text-center text-sm font-semibold uppercase tracking-[0.2em] text-navy-900">
            {tr(c['how.title']) || t('home.how.title')}
          </h2>
          <ol className="mt-8 grid gap-4 sm:grid-cols-3 sm:gap-5">
            {HOW_STEPS.map((step, i) => (
              <li key={step.key} className="flex flex-col items-center rounded-xl border border-navy-100 bg-navy-50 px-6 pb-8 pt-9 text-center">
                <StepIcon main={step.icon} badge={step.badge} />
                <p className="mt-6 text-2xs font-semibold uppercase tracking-[0.14em] text-gold-700">{t('home.how.step')} {i + 1}</p>
                <h3 className="mt-1.5 text-lg font-semibold text-navy-900">{t(`home.how.${step.key}`)}</h3>
                {content ? (
                  tr(c[`how.${step.key}`]) && <p className="mt-2 max-w-[260px] text-sm leading-relaxed text-slate-600">{tr(c[`how.${step.key}`])}</p>
                ) : contentLoading && (
                  <div className="mt-3 w-full max-w-[220px] space-y-1.5" aria-hidden="true">
                    <Skeleton className="h-3.5 w-full bg-navy-100" />
                    <Skeleton className="mx-auto h-3.5 w-2/3 bg-navy-100" />
                  </div>
                )}
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Plans */}
      <section id="plans" className="scroll-mt-24 border-b border-navy-100 bg-navy-50">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <div className="max-w-2xl">
            <h2 className="text-2xl font-semibold sm:text-3xl">{t('home.plansTitle')}</h2>
            <p className="mt-2 text-slate-600">{t('home.plansSub')}</p>
          </div>
          {tiersError && !tiers.length && <LoadError className="mt-10" onRetry={refetchTiers} />}
          <div className={`mt-10 grid gap-4 ${tiers.length >= 3 || tiersLoading ? 'lg:grid-cols-3' : 'md:grid-cols-2'} ${tiersError && !tiers.length ? 'hidden' : ''}`}>
            {tiersLoading && [0, 1, 2].map((i) => <Skeleton key={i} className="h-80 rounded-lg" />)}
            {tiers.map((tier) => {
              const isFeatured = tier.id === featured?.id;
              return (
                <div key={tier.id} className={`relative flex flex-col rounded-lg border bg-white p-6 ${isFeatured ? 'border-navy-900 ring-1 ring-navy-900' : 'border-slate-200'}`}>
                  {isFeatured && (
                    <span className="absolute -top-2.5 left-6 rounded-full bg-gold-400 px-2.5 py-0.5 text-2xs font-semibold uppercase tracking-wider text-navy-950">{t('common.mostPopular')}</span>
                  )}
                  <div className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full" style={{ backgroundColor: tier.color }} />
                    <h3 className="text-lg font-semibold">{tr(tier.name)}</h3>
                  </div>
                  <p className="mt-2 min-h-[40px] text-sm text-slate-600">{tr(tier.description)}</p>
                  <div className="mt-6 flex items-baseline gap-1.5">
                    <span className="font-display text-3xl font-bold tabular-nums tracking-tight">{money(tier.price, content?.settings?.currency, locale)}</span>
                  </div>
                  <p className="text-xs text-slate-500">{t('common.perPeriod')} {duration(tier.duration_value, tier.duration_unit, t)}</p>
                  <ul className="mt-6 flex-1 space-y-2.5 border-t border-slate-100 pt-5">
                    {(tier.features || []).map((f, i) => (
                      <li key={i} className="flex items-start gap-2.5 text-sm text-slate-700">
                        <Icon icon={Check} size={15} className="mt-0.5 shrink-0 text-emerald-600" />
                        {tr(f)}
                      </li>
                    ))}
                    <li className="flex items-start gap-2.5 text-sm text-slate-700">
                      <Icon icon={Check} size={15} className="mt-0.5 shrink-0 text-emerald-600" />
                      <span><span className="font-semibold tabular-nums">{tier.offers_count}</span> {t('home.offersIncluded').toLowerCase()}</span>
                    </li>
                  </ul>
                  <Button className="mt-6 w-full justify-center" variant={isFeatured ? 'primary' : 'secondary'} onClick={() => choose(tier)}>
                    {t('home.selectPlan')}
                  </Button>
                </div>
              );
            })}
          </div>

          {/* Live comparison matrix */}
          {tiers.length > 0 && offerRows.length > 0 && (
            <div className="mt-14">
              <h3 className="text-lg font-semibold">{t('home.compareTitle')}</h3>
              <div className="surface mt-4 overflow-x-auto">
                <table className="w-full min-w-[640px] text-sm">
                  <thead>
                    <tr className="border-b border-navy-900 bg-navy-900 text-white">
                      <th className="px-4 py-3 text-left text-2xs font-semibold uppercase tracking-[0.06em] text-gold-300">{t('home.feature')}</th>
                      {tiers.map((tier) => (
                        <th key={tier.id} className="px-4 py-3 text-center">
                          <span className="inline-flex items-center gap-1.5 text-sm font-semibold"><span className="h-2 w-2 rounded-full" style={{ backgroundColor: tier.color }} />{tr(tier.name)}</span>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <tr>
                      <td className="px-4 py-3 font-medium text-slate-700">{t('checkout.total')}</td>
                      {tiers.map((tier) => <td key={tier.id} className="px-4 py-3 text-center font-semibold tabular-nums">{money(tier.price, 'LKR', locale)}</td>)}
                    </tr>
                    <tr>
                      <td className="px-4 py-3 font-medium text-slate-700">{t('portal.validUntil')}</td>
                      {tiers.map((tier) => <td key={tier.id} className="px-4 py-3 text-center tabular-nums text-slate-600">{duration(tier.duration_value, tier.duration_unit, t)}</td>)}
                    </tr>
                    <tr>
                      <td className="px-4 py-3 font-medium text-slate-700">{t('home.offersIncluded')}</td>
                      {tiers.map((tier) => <td key={tier.id} className="px-4 py-3 text-center font-semibold tabular-nums">{number(tier.offers_count)}</td>)}
                    </tr>
                    {offerRows.slice(0, 12).map((o) => (
                      <tr key={o.id}>
                        <td className="px-4 py-2.5">
                          <span className="text-navy-800">{tr(o.title)}</span>
                          <span className="ml-2 text-xs text-slate-400">{tr(o.partnerName)} · {offerValue(o, t)}</span>
                        </td>
                        {tiers.map((tier) => (
                          <td key={tier.id} className="px-4 py-2.5 text-center">
                            {o.tier_ids?.includes(tier.id) ? (
                              <Icon icon={Check} size={16} className="mx-auto text-emerald-600" />
                            ) : (
                              <Icon icon={Lock} size={13} className="mx-auto text-slate-300" />
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Partner preview */}
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div className="max-w-2xl">
              <h2 className="text-2xl font-semibold sm:text-3xl">{t('home.partnersTitle')}</h2>
              <p className="mt-2 text-slate-600">{t('home.partnersSub')}</p>
            </div>
            <Link to="/partners" className="group inline-flex shrink-0 items-center gap-1.5 text-sm font-semibold text-navy-900 hover:underline">
              {t('home.allPartners')}
              <Icon icon={ArrowRight} size={16} className="transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>

          {/* Plan picker: shows which offers each plan includes. Labelled, so it's clear what it changes. */}
          {tiers.length > 0 && (
            <div className="mt-6 flex flex-wrap items-center gap-2" role="radiogroup" aria-label={t('home.offersFor')}>
              <span className="mr-1 text-sm text-slate-500">{t('home.offersFor')}</span>
              {tiers.map((x) => {
                const active = x.id === viewTier?.id;
                return (
                  <button
                    key={x.id}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() => setViewTierId(x.id)}
                    className={`inline-flex h-9 items-center gap-2 rounded-full border px-4 text-sm font-medium transition-colors ${
                      active ? 'border-navy-900 bg-navy-900 text-white' : 'border-slate-200 bg-white text-slate-700 hover:border-navy-300'
                    }`}
                  >
                    <span className="h-2.5 w-2.5 rounded-full ring-1 ring-white/40" style={{ backgroundColor: x.color }} />
                    {tr(x.name)}
                  </button>
                );
              })}
            </div>
          )}
          {partnersError && !partners ? (
            <LoadError className="mt-8" onRetry={refetchPartners} />
          ) : (
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {partnersLoading && [0, 1, 2].map((i) => <Skeleton key={i} className="h-60 rounded-xl" />)}
              {(partners?.data || []).slice(0, 6).map((p) => <PartnerCard key={p.id} partner={p} viewTier={viewTier} />)}
            </div>
          )}
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="scroll-mt-24 bg-navy-50">
        <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
          <h2 className="text-2xl font-semibold sm:text-3xl">{t('home.faqTitle')}</h2>
          {contentError && !content && <LoadError className="mt-8" onRetry={refetchContent} />}
          <div className={`mt-8 divide-y divide-slate-200 border-y border-slate-200 ${contentError && !content ? 'hidden' : ''}`}>
            {contentLoading && [0, 1, 2, 3].map((i) => (
              <div key={i} className="flex items-center justify-between gap-4 py-4">
                <Skeleton className={`h-4 ${i % 2 ? 'w-2/3' : 'w-1/2'}`} />
                <Skeleton className="h-4 w-4" />
              </div>
            ))}
            {faqs.map((f, i) => (
              <div key={f.id}>
                <button onClick={() => setOpenFaq(openFaq === i ? -1 : i)} className="flex w-full items-center justify-between gap-4 py-4 text-left">
                  <span className="text-[15px] font-medium text-navy-900">{tr(f.question)}</span>
                  <Icon icon={ChevronDown} size={16} className={`shrink-0 text-slate-400 transition-transform ${openFaq === i ? 'rotate-180' : ''}`} />
                </button>
                {openFaq === i && <p className="-mt-1 pb-5 text-sm leading-relaxed text-slate-600">{tr(f.answer)}</p>}
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
