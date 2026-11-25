import { useState } from 'react';
import { RotateCw, QrCode, CreditCard, Eye } from 'lucide-react';
import CardFront, { CardBack, CARD_MM } from './card/CardFront';

/**
 * Digital membership card — displays the authentic Privilege Card artwork (Silver, Gold, Platinum)
 * and verified QR back side exactly like the Admin print view, with Front/Back flipping and side-by-side mode.
 */
export default function MembershipCard({
  name,
  memberCode,
  tierSlug,
  tierName,
  tierColor,
  expiresAt,
  memberSince,
  verifyUrl,
  status = 'active',
  brandSi,
  brandEn,
  logoUrl,
  contactPhone,
  contactEmail,
  locale = 'en',
  labels = {},
  className = '',
}) {
  const active = status === 'active';
  const [view, setView] = useState('both'); // 'both' | 'front' | 'back'

  const effectiveSlug = tierSlug || 'silver';
  const effectiveName = tierName || 'Silver';

  const L = {
    front: 'Front',
    back: 'Back (QR Code)',
    both: 'Both sides',
    flip: 'Flip card',
    inactive: labels.expired || labels.inactive || 'Inactive',
    scanToVerify: 'Scan to verify',
    ...labels,
  };

  return (
    <div className={`mx-auto w-full ${className}`}>
      {/* Top Toggle Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="inline-flex rounded-lg bg-slate-100 p-1 border border-slate-200">
          <button
            type="button"
            onClick={() => setView('both')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
              view === 'both' ? 'bg-white text-navy-950 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>{L.both}</span>
          </button>
          <button
            type="button"
            onClick={() => setView('front')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
              view === 'front' ? 'bg-white text-navy-950 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>{L.front}</span>
          </button>
          <button
            type="button"
            onClick={() => setView('back')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
              view === 'back' ? 'bg-white text-navy-950 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <QrCode className="w-3.5 h-3.5" />
            <span>{L.back}</span>
          </button>
        </div>

        <button
          type="button"
          onClick={() => setView((v) => (v === 'front' ? 'back' : 'front'))}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-navy-700 hover:text-navy-900 transition-colors"
        >
          <RotateCw className="w-3.5 h-3.5 text-slate-400" />
          <span>{L.flip}</span>
        </button>
      </div>

      {/* Cards View */}
      {view === 'both' ? (
        <div className="grid gap-5 md:grid-cols-2">
          {/* Front */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-slate-500">{L.front}</span>
              <span className="text-2xs font-semibold uppercase tracking-wider text-slate-400">
                {effectiveName} Privilege Card
              </span>
            </div>
            <div style={{ containerType: 'inline-size' }}>
              <div
                style={{ aspectRatio: `${CARD_MM.w} / ${CARD_MM.h}` }}
                className="rounded-[4cqw] shadow-[0_2px_4px_rgb(19_34_74/0.08),0_18px_32px_-20px_rgb(19_34_74/0.5)] cursor-pointer hover:scale-[1.01] transition-transform"
                onClick={() => setView('front')}
                title="Click to view front full width"
              >
                <CardFront
                  unit="cq"
                  name={name}
                  memberCode={memberCode}
                  tierSlug={effectiveSlug}
                  tierName={effectiveName}
                  tierColor={tierColor}
                  expiresAt={expiresAt}
                  verifyUrl={verifyUrl}
                  active={active}
                  brandSi={brandSi}
                  brandEn={brandEn}
                  logoUrl={logoUrl}
                  locale={locale}
                  labels={{ ...labels, inactive: L.inactive }}
                />
              </div>
            </div>
          </div>

          {/* Back */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-slate-500">{L.back}</span>
              <span className="text-2xs font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
                {L.scanToVerify}
              </span>
            </div>
            <div style={{ containerType: 'inline-size' }}>
              <div
                style={{ aspectRatio: `${CARD_MM.w} / ${CARD_MM.h}` }}
                className="rounded-[4cqw] shadow-[0_2px_4px_rgb(19_34_74/0.08),0_18px_32px_-20px_rgb(19_34_74/0.5)] cursor-pointer hover:scale-[1.01] transition-transform"
                onClick={() => setView('back')}
                title="Click to view back full width"
              >
                <CardBack
                  unit="cq"
                  name={name}
                  verifyUrl={verifyUrl}
                  memberCode={memberCode}
                  memberSince={memberSince}
                  contactPhone={contactPhone}
                  contactEmail={contactEmail}
                  locale={locale}
                  labels={labels}
                />
              </div>
            </div>
          </div>
        </div>
      ) : view === 'front' ? (
        <div className="mx-auto w-full max-w-[500px]" style={{ containerType: 'inline-size' }}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-500">{L.front}</span>
            <span className="text-2xs font-semibold uppercase tracking-wider text-slate-400">
              {effectiveName} Privilege Card
            </span>
          </div>
          <div
            style={{ aspectRatio: `${CARD_MM.w} / ${CARD_MM.h}` }}
            className="rounded-[4cqw] shadow-[0_2px_4px_rgb(19_34_74/0.08),0_22px_40px_-22px_rgb(19_34_74/0.55)] cursor-pointer"
            onClick={() => setView('back')}
            title="Click to flip to back"
          >
            <CardFront
              unit="cq"
              name={name}
              memberCode={memberCode}
              tierSlug={effectiveSlug}
              tierName={effectiveName}
              tierColor={tierColor}
              expiresAt={expiresAt}
              verifyUrl={verifyUrl}
              active={active}
              brandSi={brandSi}
              brandEn={brandEn}
              logoUrl={logoUrl}
              locale={locale}
              labels={{ ...labels, inactive: L.inactive }}
            />
          </div>
        </div>
      ) : (
        <div className="mx-auto w-full max-w-[500px]" style={{ containerType: 'inline-size' }}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-500">{L.back}</span>
            <span className="text-2xs font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
              {L.scanToVerify}
            </span>
          </div>
          <div
            style={{ aspectRatio: `${CARD_MM.w} / ${CARD_MM.h}` }}
            className="rounded-[4cqw] shadow-[0_2px_4px_rgb(19_34_74/0.08),0_22px_40px_-22px_rgb(19_34_74/0.55)] cursor-pointer"
            onClick={() => setView('front')}
            title="Click to flip to front"
          >
            <CardBack
              unit="cq"
              name={name}
              verifyUrl={verifyUrl}
              memberCode={memberCode}
              memberSince={memberSince}
              contactPhone={contactPhone}
              contactEmail={contactEmail}
              locale={locale}
              labels={labels}
            />
          </div>
        </div>
      )}
    </div>
  );
}
