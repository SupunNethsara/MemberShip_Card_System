import { Check, MapPin } from 'lucide-react';
import { Icon } from '../ui';
import { useT } from '../../hooks';
import { offerValue } from '../../lib/format';
import CategoryIcon from './CategoryIcon';

const MAX_OFFERS = 3;

/**
 * A partner business and its live offers.
 * With `viewTier` (a tier object) each offer reads as included or "from <lowest tier that unlocks it>";
 * without it, each offer simply names the lowest tier that unlocks it.
 */
export default function PartnerCard({ partner, viewTier }) {
  const { t, tr } = useT();
  const offers = partner.offers || [];
  const shown = offers.slice(0, MAX_OFFERS);
  const more = offers.length - shown.length;

  return (
    <article className="flex flex-col rounded-xl border border-slate-200 bg-white p-5 transition-colors hover:border-navy-200">
      <header className="flex items-center gap-3.5">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-100 bg-navy-50">
          {partner.logo_url ? (
            <img src={partner.logo_url} alt="" className="h-full w-full object-cover" loading="lazy" />
          ) : (
            <CategoryIcon name={partner.category?.icon} size={22} className="text-navy-700" />
          )}
        </div>
        <div className="min-w-0">
          <h3 className="truncate text-base font-semibold text-navy-900">{tr(partner.name)}</h3>
          <p className="mt-0.5 truncate text-[13px] text-slate-500">
            {tr(partner.category?.name)}
            {partner.city && <> · {partner.city}</>}
          </p>
        </div>
      </header>

      <ul className="mt-4 flex-1 space-y-2">
        {shown.map((offer) => {
          const lowest = [...(offer.tiers || [])].sort((a, b) => a.priority - b.priority)[0];
          const included = viewTier ? offer.tier_ids?.includes(viewTier.id) : null;
          return (
            <li key={offer.id} className={`flex items-center gap-3 rounded-lg px-3 py-2.5 ${included === false ? 'bg-slate-50' : 'bg-navy-50'}`}>
              <div className="min-w-0 flex-1">
                <p className={`font-display text-[15px] font-bold leading-tight tabular-nums ${included === false ? 'text-slate-400' : 'text-gold-700'}`}>
                  {offerValue(offer, t)}
                </p>
                <p className={`mt-0.5 truncate text-[13px] ${included === false ? 'text-slate-400' : 'text-navy-900'}`}>{tr(offer.title)}</p>
              </div>
              {included ? (
                <Icon icon={Check} size={16} className="shrink-0 text-navy-700" aria-label={t('offers.unlocked')} />
              ) : lowest && (
                <span className="shrink-0 whitespace-nowrap text-[11px] font-medium text-slate-500">
                  {t('offers.fromTier').replace('{tier}', tr(lowest.name))}
                </span>
              )}
            </li>
          );
        })}
        {offers.length === 0 && <li className="rounded-lg bg-slate-50 px-3 py-2.5 text-[13px] text-slate-400">{t('offers.noneYet')}</li>}
      </ul>

      {(more > 0 || partner.google_maps_url) && (
        <footer className="mt-4 flex items-center justify-between gap-3 text-[13px]">
          <span className="text-slate-500">{more > 0 && t('offers.more').replace('{n}', more)}</span>
          {partner.google_maps_url && (
            <a href={partner.google_maps_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-medium text-navy-800 hover:text-navy-900 hover:underline">
              <Icon icon={MapPin} size={14} /> {t('partners.directions')}
            </a>
          )}
        </footer>
      )}
    </article>
  );
}
