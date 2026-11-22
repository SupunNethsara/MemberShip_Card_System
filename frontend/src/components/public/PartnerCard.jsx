import { Lock, MapPin, Navigation, Unlock } from 'lucide-react';
import { Icon, TierBadge } from '../ui';
import { useT } from '../../hooks';
import { offerValue } from '../../lib/format';
import CategoryIcon from './CategoryIcon';

/**
 * Partner with its live offers. When `viewTier` is set (a tier object), each offer shows
 * an Unlocked / Locked badge for that tier; otherwise it lists the tiers that unlock it.
 */
export default function PartnerCard({ partner, viewTier }) {
  const { t, tr } = useT();
  const offers = partner.offers || [];

  return (
    <article className="surface flex flex-col overflow-hidden transition-colors hover:border-slate-300">
      <div className="flex items-start gap-3 border-b border-slate-100 p-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
          {partner.logo_url ? (
            <img src={partner.logo_url} alt="" className="h-full w-full object-cover" />
          ) : (
            <CategoryIcon name={partner.category?.icon} size={18} className="text-slate-500" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-sm font-semibold text-navy-900">{tr(partner.name)}</h3>
          <p className="mt-0.5 flex items-center gap-1 text-xs text-slate-500">
            <span>{tr(partner.category?.name)}</span>
            {partner.city && (
              <>
                <span className="text-slate-300">·</span>
                <Icon icon={MapPin} size={11} />
                <span>{partner.city}</span>
              </>
            )}
          </p>
        </div>
        {partner.google_maps_url && (
          <a href={partner.google_maps_url} target="_blank" rel="noreferrer" className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-navy-900" title={t('partners.directions')}>
            <Icon icon={Navigation} size={14} />
          </a>
        )}
      </div>

      <ul className="flex-1 divide-y divide-slate-100">
        {offers.map((offer) => {
          const unlocked = viewTier ? offer.tier_ids?.includes(viewTier.id) : null;
          const minTier = [...(offer.tiers || [])].sort((a, b) => a.priority - b.priority)[0];
          return (
            <li key={offer.id} className="flex items-start justify-between gap-3 px-4 py-3">
              <div className="min-w-0">
                <p className={`text-[13px] font-medium ${unlocked === false ? 'text-slate-400' : 'text-navy-800'}`}>{tr(offer.title)}</p>
                <p className="mt-0.5 text-xs font-semibold tabular-nums text-emerald-700">{offerValue(offer, t)}</p>
              </div>
              {unlocked === null ? (
                <div className="flex shrink-0 flex-wrap justify-end gap-1">
                  {(offer.tiers || []).map((tier) => <TierBadge key={tier.id} name={tr(tier.name)} color={tier.color} />)}
                </div>
              ) : unlocked ? (
                <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-2xs font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
                  <Icon icon={Unlock} size={11} /> {t('offers.unlocked')}
                </span>
              ) : (
                <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-2xs font-medium text-slate-500" title={minTier ? `${t('offers.unlockWith')} ${tr(minTier.name)}` : ''}>
                  <Icon icon={Lock} size={11} /> {minTier ? tr(minTier.name) : t('offers.locked')}
                </span>
              )}
            </li>
          );
        })}
        {offers.length === 0 && <li className="px-4 py-3 text-xs text-slate-400">—</li>}
      </ul>
    </article>
  );
}
