import { useState } from 'react';
import { useSelector } from 'react-redux';
import { Search, Store } from 'lucide-react';
import { Button, EmptyState, Icon, LoadError, Skeleton } from '../../components/ui';
import PartnerCard from '../../components/public/PartnerCard';
import CategoryIcon from '../../components/public/CategoryIcon';
import { usePublicCategoriesQuery, usePublicPartnersQuery, usePublicTiersQuery } from '../../app/api';
import { useDebounced, useDocumentTitle, useT } from '../../hooks';

export default function PartnersPage() {
  const { t, tr } = useT();
  useDocumentTitle(t('partners.title'));
  const user = useSelector((s) => s.auth.user);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [viewTierId, setViewTierId] = useState('');
  const [page, setPage] = useState(1);
  const debounced = useDebounced(search);

  const { data: categories = [], isLoading: categoriesLoading } = usePublicCategoriesQuery();
  const { data: tiers = [] } = usePublicTiersQuery();
  const { data, isLoading, isFetching, isError, refetch } = usePublicPartnersQuery({ search: debounced, category, page, per_page: 12 });

  const myTierId = user?.active_membership?.tier?.id;
  const viewTier = tiers.find((x) => String(x.id) === String(viewTierId || myTierId || ''));

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <h1 className="text-3xl font-semibold">{t('partners.title')}</h1>
      <p className="mt-2 text-slate-600">{t('partners.sub')}</p>

      <div className="mt-8 flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <Icon icon={Search} size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder={t('partners.searchPh')} className="field h-10 pl-9" />
        </div>
        <select value={viewTierId || myTierId || ''} onChange={(e) => setViewTierId(e.target.value)} className="field h-10 lg:w-52">
          <option value="">{t('partners.allTiers')}</option>
          {tiers.map((tier) => <option key={tier.id} value={tier.id}>{tr(tier.name)}</option>)}
        </select>
      </div>

      <div className="mt-4 flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 sm:flex-wrap">
        <CategoryChip active={!category} onClick={() => { setCategory(''); setPage(1); }} label={t('common.all')} />
        {categoriesLoading && [0, 1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-8 w-24 shrink-0 rounded-full" />)}
        {categories.map((c) => (
          <CategoryChip key={c.id} active={String(category) === String(c.id)} onClick={() => { setCategory(c.id); setPage(1); }} label={tr(c.name)} icon={c.icon} count={c.partners_count} />
        ))}
      </div>

      {isError && !isFetching ? (
        <LoadError className="mt-8" onRetry={refetch} />
      ) : (
        <div className={`mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 ${isFetching && !isLoading ? 'opacity-60' : ''}`}>
          {isLoading && Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-52 rounded-lg" />)}
          {(data?.data || []).map((p) => <PartnerCard key={p.id} partner={p} viewTier={viewTier} />)}
        </div>
      )}
      {!isLoading && !isError && data?.data?.length === 0 && <div className="surface mt-4"><EmptyState icon={Store} title={t('partners.noResults')} /></div>}

      {data?.meta && data.meta.last_page > 1 && (
        <div className="mt-8 flex items-center justify-center gap-2">
          <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>{t('common.back')}</Button>
          <span className="text-xs tabular-nums text-slate-500">{data.meta.current_page} / {data.meta.last_page}</span>
          <Button variant="secondary" size="sm" disabled={page >= data.meta.last_page} onClick={() => setPage((p) => p + 1)}>{t('common.continue')}</Button>
        </div>
      )}
    </div>
  );
}

function CategoryChip({ active, onClick, label, icon, count }) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-colors ${active ? 'border-navy-900 bg-navy-900 text-white' : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'}`}
    >
      {icon && <CategoryIcon name={icon} size={13} />}
      {label}
      {count !== undefined && <span className={`tabular-nums ${active ? 'text-white/70' : 'text-slate-400'}`}>{count}</span>}
    </button>
  );
}
