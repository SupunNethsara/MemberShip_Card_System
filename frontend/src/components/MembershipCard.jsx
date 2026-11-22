import CardFront, { CARD_MM } from './card/CardFront';

/**
 * Digital membership card — the same Jeewanasaviya design as the printed card (CardFront),
 * scaled fluidly to the available width via container-query units.
 */
export default function MembershipCard({
  name, memberCode, tierName, tierColor, expiresAt, verifyUrl, status = 'active',
  brandSi, brandEn, logoUrl, locale = 'en', labels = {}, className = '',
}) {
  const active = status === 'active';
  return (
    <div className={`mx-auto w-full max-w-[460px] ${className}`} style={{ containerType: 'inline-size' }}>
      <div
        style={{ aspectRatio: `${CARD_MM.w} / ${CARD_MM.h}` }}
        className="rounded-[4cqw] shadow-[0_2px_4px_rgb(19_34_74/0.08),0_22px_40px_-22px_rgb(19_34_74/0.55)]"
      >
        <CardFront
          unit="cq"
          name={name}
          memberCode={memberCode}
          tierName={tierName}
          tierColor={tierColor}
          expiresAt={expiresAt}
          verifyUrl={verifyUrl}
          active={active}
          brandSi={brandSi}
          brandEn={brandEn}
          logoUrl={logoUrl}
          locale={locale}
          labels={{ ...labels, inactive: labels.expired || labels.inactive || 'Inactive' }}
        />
      </div>
    </div>
  );
}
