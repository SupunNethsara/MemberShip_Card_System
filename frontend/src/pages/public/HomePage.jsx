import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { ArrowRight, Check, ChevronDown, Lock, QrCode, ShieldCheck, WalletCards } from 'lucide-react';
import { Button, Icon, Segmented, Skeleton } from '../../components/ui';
import HeroSlider from '../../components/home/HeroSlider';
import PartnerCard from '../../components/public/PartnerCard';
import { usePublicContentQuery, usePublicPartnersQuery, usePublicTiersQuery } from '../../app/api';
import { useDocumentTitle, useT } from '../../hooks';
import { duration, money, number, offerValue } from '../../lib/format';

export default function HomePage() {
  const { t, tr, locale } = useT();
  const navigate = useNavigate();
  const user = useSelector((s) => s.auth.user);
  const { data: content } = usePublicContentQuery();
  const { data: tiers = [], isLoading: tiersLoading } = usePublicTiersQuery();
  const { data: partners, isLoading: partnersLoading } = usePublicPartnersQuery({ per_page: 48 });
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
      {/* Hero slider — slides managed in Admin › CMS › Hero slides */}
      <HeroSlider
        slides={content?.hero_slides?.data ?? content?.hero_slides ?? []}
        stats={content?.stats}
        fallback={content ? {
          id: 'cms',
          badge: c['hero.eyebrow'],
          title: c['hero.title'],
          subtitle: c['hero.subtitle'],
          cta_primary_label: c['hero.cta_primary'],
          cta_primary_url: '/register',
          cta_secondary_label: c['hero.cta_secondary'],
          cta_secondary_url: '/partners',
        } : null}
      />

      {/* How it works */}
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
          <h2 className="text-2xl font-semibold">{tr(c['how.title'])}</h2>
          <ol className="mt-8 grid gap-px overflow-hidden rounded-lg border border-navy-100 bg-navy-100 md:grid-cols-3">
            {[[WalletCards, 'how.step1'], [ShieldCheck, 'how.step2'], [QrCode, 'how.step3']].map(([g, key], i) => (
              <li key={key} className="bg-white p-6">
                <div className="flex items-center gap-3">
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-navy-900 font-display text-xs font-semibold tabular-nums text-gold-300">0{i + 1}</span>
                  <Icon icon={g} size={18} className="text-gold-600" />
                </div>
                <p className="mt-4 text-[15px] font-medium leading-snug text-navy-900">{tr(c[key])}</p>
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
          <div className={`mt-10 grid gap-4 ${tiers.length >= 3 ? 'lg:grid-cols-3' : 'md:grid-cols-2'}`}>
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
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-2xl font-semibold sm:text-3xl">{t('home.partnersTitle')}</h2>
              <p className="mt-2 text-slate-600">{t('home.partnersSub')}</p>
            </div>
            {tiers.length > 0 && (
              <Segmented value={viewTier?.id} onChange={setViewTierId} options={tiers.map((x) => ({ value: x.id, label: tr(x.name) }))} />
            )}
          </div>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {partnersLoading && [0, 1, 2].map((i) => <Skeleton key={i} className="h-48 rounded-lg" />)}
            {(partners?.data || []).slice(0, 6).map((p) => <PartnerCard key={p.id} partner={p} viewTier={viewTier} />)}
          </div>
          <div className="mt-8">
            <Link to="/partners"><Button variant="secondary" iconRight={ArrowRight}>{t('common.viewAll')}</Button></Link>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="scroll-mt-24 bg-navy-50">
        <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
          <h2 className="text-2xl font-semibold sm:text-3xl">{t('home.faqTitle')}</h2>
          <div className="mt-8 divide-y divide-slate-200 border-y border-slate-200">
            {(content?.faqs?.data ?? content?.faqs ?? []).map((f, i) => (
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
