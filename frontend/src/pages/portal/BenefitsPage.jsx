import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Gift, Lock, MapPin, Search, Unlock } from 'lucide-react';
import { Button, EmptyState, Icon, PageHeader, Segmented, Skeleton, TierBadge } from '../../components/ui';
import CategoryIcon from '../../components/public/CategoryIcon';
import { useMemberBenefitsQuery, usePublicCategoriesQuery } from '../../app/api';
import { useDebounced, useDocumentTitle, useT } from '../../hooks';
import { date, offerValue } from '../../lib/format';

export default function BenefitsPage() {
  const { t, tr, locale } = useT();
  useDocumentTitle(t('portal.benefitsTitle'));
  const [scope, setScope] = useState('unlocked');
  const [category, setCategory] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const debounced = useDebounced(search);
  const { data: categories = [] } = usePublicCategoriesQuery();
  const { data, isLoading, isFetching } = useMemberBenefitsQuery({ scope, category, search: debounced, page, per_page: 12 });
  const offers = data?.data || [];

  return (
    <div>
      <PageHeader
        title={t('portal.benefitsTitle')}
        description={t('portal.benefitsSub')}
        actions={<Segmented value={scope} onChange={(v) => { setScope(v); setPage(1); }} options={[{ value: 'unlocked', label: t('portal.unlockedOnly') }, { value: 'all', label: t('portal.showAll') }]} />}
      />

      <div className="mb-6 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Icon icon={Search} size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder={t('partners.searchPh')} className="field pl-9" />
        </div>
        <select value={category} onChange={(e) => { setCategory(e.target.value); setPage(1); }} className="field sm:w-56">
          <option value="">{t('common.all')}</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{tr(c.name)}</option>)}
        </select>
      </div>

      <div className={`grid gap-4 sm:grid-cols-2 ${isFetching && !isLoading ? 'opacity-60' : ''}`}>
        {isLoading && [0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-40 rounded-lg" />)}
        {offers.map((o) => (
          <article key={o.id} className={`surface flex flex-col p-5 ${o.is_unlocked ? '' : 'bg-slate-50/60'}`}>
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-white">
                {o.partner?.logo_url ? <img src={o.partner.logo_url} alt="" className="h-full w-full object-cover" /> : <CategoryIcon name={o.partner?.category?.icon} size={17} className="text-slate-500" />}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs text-slate-500">{tr(o.partner?.name)}{o.partner?.city && <> · <Icon icon={MapPin} size={10} className="inline" /> {o.partner.city}</>}</p>
                <h3 className={`mt-0.5 text-[15px] font-semibold ${o.is_unlocked ? 'text-navy-900' : 'text-slate-500'}`}>{tr(o.title)}</h3>
              </div>
              {o.is_unlocked ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-2xs font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-600/20"><Icon icon={Unlock} size={11} />{t('offers.unlocked')}</span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-2xs font-medium text-slate-500"><Icon icon={Lock} size={11} />{t('offers.locked')}</span>
              )}
            </div>
            <p className="mt-3 font-display text-xl font-semibold tabular-nums text-emerald-700">{offerValue(o, t)}</p>
            {tr(o.description) && <p className="mt-1 text-sm text-slate-600">{tr(o.description)}</p>}
            <div className="mt-auto flex flex-wrap items-center justify-between gap-2 pt-4 text-xs text-slate-500">
              <div className="flex flex-wrap gap-1">{(o.tiers || []).map((x) => <TierBadge key={x.id} name={tr(x.name)} color={x.color} />)}</div>
              {o.ends_at && <span className="tabular-nums">{t('offers.validUntil')} {date(o.ends_at, locale)}</span>}
            </div>
            {tr(o.terms) && <p className="mt-3 border-t border-slate-100 pt-3 text-2xs text-slate-400">{t('offers.terms')}: {tr(o.terms)}</p>}
          </article>
        ))}
      </div>

      {!isLoading && offers.length === 0 && (
        <div className="surface">
          <EmptyState
            icon={Gift}
            title={scope === 'unlocked' ? t('portal.noPlanTitle') : t('partners.noResults')}
            description={scope === 'unlocked' ? t('portal.noPlanSub') : undefined}
            action={scope === 'unlocked' && <Link to="/portal/checkout"><Button>{t('portal.choosePlan')}</Button></Link>}
          />
        </div>
      )}

      {data?.meta?.last_page > 1 && (
        <div className="mt-6 flex items-center justify-center gap-2">
          <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>{t('common.back')}</Button>
          <span className="text-xs tabular-nums text-slate-500">{page} / {data.meta.last_page}</span>
          <Button variant="secondary" size="sm" disabled={page >= data.meta.last_page} onClick={() => setPage((p) => p + 1)}>{t('common.continue')}</Button>
        </div>
      )}
    </div>
  );
}
