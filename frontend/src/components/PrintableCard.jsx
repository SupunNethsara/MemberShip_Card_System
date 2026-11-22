import { createPortal } from 'react-dom';
import CardFront, { CardBack, NAVY } from './card/CardFront';

/**
 * Member self-print: one CR80 card (front + back) on A4 with cut guides.
 * Rendered into <body> outside #root; index.css hides the app and shows .print-sheet in @media print.
 */
export default function PrintableCard({
  name, memberCode, tierName, tierColor = NAVY, expiresAt, memberSince, verifyUrl, active = true,
  siteName = 'Jeewanasaviya', brandSi = 'ජීවනසවිය', brandEn = 'JEEWANASAVIYA', logoUrl,
  contactEmail, contactPhone, locale = 'en', labels = {},
}) {
  const L = { scan: 'Scan to verify membership', cut: 'Cut along the dotted lines. Fold or laminate back-to-back.', ...labels };

  const sheet = (
    <div className="print-sheet" aria-hidden="true">
      <div style={{ fontFamily: 'Inter, "Noto Sans Sinhala", "Noto Sans Tamil", system-ui, sans-serif', color: NAVY }}>
        <p style={{ fontSize: '8pt', color: '#64748b', margin: '0 0 6mm' }}>{siteName} · {memberCode} — {L.cut}</p>
        <div style={{ display: 'flex', gap: '10mm', flexWrap: 'wrap' }}>
          <CutFrame>
            <CardFront unit="mm" name={name} memberCode={memberCode} tierName={tierName} tierColor={tierColor} expiresAt={expiresAt}
              verifyUrl={verifyUrl} active={active} brandSi={brandSi} brandEn={brandEn} logoUrl={logoUrl} locale={locale} labels={L} />
          </CutFrame>
          <CutFrame>
            <CardBack unit="mm" memberCode={memberCode} memberSince={memberSince} contactPhone={contactPhone} contactEmail={contactEmail} locale={locale} labels={L} />
          </CutFrame>
        </div>
        <p style={{ fontSize: '7pt', color: '#94a3b8', marginTop: '6mm' }}>{L.scan}<br />{verifyUrl}</p>
      </div>
    </div>
  );

  return createPortal(sheet, document.body);
}

function CutFrame({ children }) {
  return <div style={{ padding: '2mm', border: '0.25mm dashed #94a3b8', borderRadius: '5mm', breakInside: 'avoid' }}>{children}</div>;
}
