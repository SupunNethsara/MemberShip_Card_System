import { useId } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { date } from '../../lib/format';
import ArtworkCardFront, { cardArtFor } from './ArtworkCardFront';

/**
 * Jeewanasaviya membership card — one design shared by the digital card, the member's own print,
 * and the staff print queue (A4 sheets / CR80 card printers).
 *
 * Geometry is authored in millimetres on the ISO/IEC 7810 ID-1 (CR80) card, 85.6 × 53.98 mm.
 *   unit="mm"  → real millimetres (print)
 *   unit="cq"  → container-query units, so the card scales with its parent's width (screen).
 *                The parent must set `container-type: inline-size`.
 *
 * variant="standard" → name, member ID, valid until (digital card)
 * variant="id"       → adds NIC and joined date (staff-printed PVC card)
 */
export const CARD_MM = { w: 85.6, h: 53.98 };
export const NAVY = '#13224a';
const NAVY_LABEL = '#2f4b8d';
const GOLD = '#d4a537';
const MONO = 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace';
const PT = 0.3528; // 1pt in mm

export function lighten(hex, amount = 0.35) {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex || '');
  if (!m) return hex;
  const n = parseInt(m[1], 16);
  const mix = (c) => Math.round(c + (255 - c) * amount);
  return `rgb(${mix((n >> 16) & 255)}, ${mix((n >> 8) & 255)}, ${mix(n & 255)})`;
}

export function makeUnit(unit) {
  const f = 100 / CARD_MM.w;
  return {
    mm: (v) => (unit === 'mm' ? `${v}mm` : `${(v * f).toFixed(4)}cqw`),
    pt: (v) => (unit === 'mm' ? `${v}pt` : `${(v * PT * f).toFixed(4)}cqw`),
  };
}

/** Gold-framed white card shell (front and back). */
export function CardShell({ unit = 'mm', children, style }) {
  const u = makeUnit(unit);
  return (
    <div
      style={{
        position: 'relative', overflow: 'hidden', boxSizing: 'border-box', background: '#fff',
        width: unit === 'mm' ? `${CARD_MM.w}mm` : '100%',
        height: unit === 'mm' ? `${CARD_MM.h}mm` : '100%',
        borderRadius: u.mm(3.4),
        border: `${u.mm(0.7)} solid ${GOLD}`,
        boxShadow: `inset 0 0 0 ${u.mm(0.25)} ${lighten(GOLD, 0.55)}`,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function Field({ u, label, value, mono, color = NAVY, size = 7.6 }) {
  return (
    <div style={{ minWidth: 0 }}>
      <div style={{ fontSize: u.pt(5.4), fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: NAVY_LABEL, lineHeight: 1.2, whiteSpace: 'nowrap' }}>{label}</div>
      <div style={{ fontFamily: mono ? MONO : undefined, fontSize: u.pt(size), fontWeight: 600, marginTop: u.mm(0.6), lineHeight: 1.15, letterSpacing: mono ? '0.02em' : undefined, color, fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>{value || '—'}</div>
    </div>
  );
}

function Divider({ u }) {
  return <div style={{ width: u.mm(0.25), alignSelf: 'stretch', background: '#94a3b8', margin: `${u.mm(0.6)} ${u.mm(2.6)}` }} />;
}

export default function CardFront({
  unit = 'mm', variant = 'standard', name, memberCode, nic, joinedAt, tierSlug, tierName, tierColor = NAVY,
  expiresAt, verifyUrl, active = true, brandSi = 'ජීවනසවිය', brandEn = 'JEEWANASAVIYA', logoUrl, locale = 'en', labels = {},
}) {
  const u = makeUnit(unit);
  const gid = useId().replace(/:/g, '');
  const art = cardArtFor(tierSlug, tierName);
  if (art) {
    // Client artwork tiers (Silver / Gold / Platinum): name, NIC and QR move to the card back.
    return <ArtworkCardFront unit={unit} art={art} memberCode={memberCode} expiresAt={expiresAt} active={active} inactiveLabel={labels.inactive || 'Inactive'} />;
  }
  const pill = active ? tierColor : '#e11d48';
  const isId = variant === 'id';
  const L = { member: 'Member', memberId: 'Member ID', validUntil: 'Valid until', nic: 'NIC', joined: 'Joined', inactive: 'Inactive', ...labels };
  const valid = expiresAt ? date(expiresAt, locale) : '—';
  const qrSize = isId ? 15 : 16.4;

  return (
    <CardShell unit={unit}>
      {/* Bottom navy wave with gold swoosh (viewBox units = 0.1 mm) */}
      <svg viewBox="0 0 856 540" preserveAspectRatio="none" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} aria-hidden="true">
        <defs>
          <linearGradient id={`${gid}-gold`} x1="0" x2="1" y1="0" y2="0">
            <stop offset="0" stopColor="#b8862a" />
            <stop offset="0.45" stopColor="#f2d27a" />
            <stop offset="1" stopColor="#c99227" />
          </linearGradient>
          <linearGradient id={`${gid}-navy`} x1="0" x2="1" y1="0" y2="0">
            <stop offset="0" stopColor="#0b1631" />
            <stop offset="1" stopColor="#1c2f5c" />
          </linearGradient>
        </defs>
        <path d="M0,452 C250,548 560,490 856,372 L856,540 L0,540 Z" fill={`url(#${gid}-navy)`} />
        <path d="M0,436 C250,532 560,474 856,356" fill="none" stroke={`url(#${gid}-gold)`} strokeWidth="16" />
        <path d="M0,418 C250,512 560,456 856,340" fill="none" stroke={lighten(GOLD, 0.4)} strokeWidth="3" opacity="0.8" />
      </svg>

      {/* Brand lockup */}
      <div style={{ position: 'absolute', left: u.mm(3.4), top: u.mm(2.6), display: 'flex', alignItems: 'center', gap: u.mm(2) }}>
        <img src={logoUrl || '/brand/jeewanasaviya-logo.png'} alt="" style={{ height: u.mm(13.5), width: 'auto', objectFit: 'contain', display: 'block' }} />
        <div style={{ lineHeight: 1 }}>
          <div style={{ fontFamily: '"Noto Sans Sinhala", Inter, sans-serif', fontSize: u.pt(15), fontWeight: 700, color: NAVY, letterSpacing: '-0.01em' }}>{brandSi}</div>
          <div style={{ fontSize: u.pt(6.6), fontWeight: 800, letterSpacing: '0.06em', color: NAVY, marginTop: u.mm(1.1) }}>{brandEn}</div>
        </div>
      </div>

      {/* Tier pill */}
      <div style={{
        position: 'absolute', right: u.mm(3.6), top: u.mm(4.4), minWidth: u.mm(15), textAlign: 'center',
        padding: `${u.mm(1.2)} ${u.mm(3)}`, borderRadius: u.mm(10), color: '#fff', fontSize: u.pt(7.4), fontWeight: 800,
        letterSpacing: '0.04em', textTransform: 'uppercase', lineHeight: 1.2,
        background: `linear-gradient(180deg, ${lighten(pill, 0.4)} 0%, ${pill} 55%, ${pill} 100%)`,
        boxShadow: `0 ${u.mm(0.3)} ${u.mm(0.6)} rgba(19,34,74,0.25)`,
        textShadow: `0 ${u.mm(0.2)} ${u.mm(0.3)} rgba(0,0,0,0.25)`,
      }}>
        {active ? tierName : L.inactive}
      </div>

      {isId ? (
        <>
          {/* Details column */}
          <div style={{ position: 'absolute', left: u.mm(5), right: u.mm(23.4), top: u.mm(16.8) }}>
            <div style={{ fontSize: u.pt(5.4), fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: NAVY_LABEL, lineHeight: 1.2 }}>{L.member}</div>
            <div style={{ fontSize: u.pt(10.5), fontWeight: 700, marginTop: u.mm(0.4), lineHeight: 1.15, color: NAVY, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</div>
          </div>
          <div style={{ position: 'absolute', left: u.mm(5), top: u.mm(24.3), display: 'flex', lineHeight: 1.15 }}>
            <Field u={u} label={L.memberId} value={memberCode} mono size={6.8} />
            <Divider u={u} />
            <Field u={u} label={L.nic} value={nic} mono size={6.8} />
          </div>
          <div style={{ position: 'absolute', left: u.mm(5), top: u.mm(31.4), display: 'flex', lineHeight: 1.15 }}>
            <Field u={u} label={L.joined} value={joinedAt ? date(joinedAt, locale) : '—'} size={6.8} />
            <Divider u={u} />
            <Field u={u} label={L.validUntil} value={valid} size={6.8} color={active ? NAVY : '#e11d48'} />
          </div>
        </>
      ) : (
        <>
          <div style={{ position: 'absolute', left: u.mm(5), top: u.mm(18.6), right: u.mm(26) }}>
            <div style={{ fontSize: u.pt(5.4), fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: NAVY_LABEL, lineHeight: 1.2 }}>{L.member}</div>
            <div style={{ fontSize: u.pt(11), fontWeight: 600, marginTop: u.mm(0.6), lineHeight: 1.15, color: NAVY, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</div>
          </div>
          <div style={{ position: 'absolute', left: u.mm(5), top: u.mm(30.4), display: 'flex' }}>
            <Field u={u} label={L.memberId} value={memberCode} mono />
            <Divider u={u} />
            <Field u={u} label={L.validUntil} value={valid} color={active ? NAVY : '#e11d48'} />
          </div>
        </>
      )}

      {/* QR → public verification URL */}
      <div style={{ position: 'absolute', right: u.mm(4.6), top: u.mm(isId ? 16.4 : 14.2), padding: u.mm(0.8), background: '#fff', borderRadius: u.mm(1), border: `${u.mm(0.2)} solid #e2e8f0`, opacity: active ? 1 : 0.35, lineHeight: 0 }}>
        {verifyUrl ? (
          <QRCodeSVG value={verifyUrl} size={256} level="M" fgColor={NAVY} bgColor="#ffffff" style={{ width: u.mm(qrSize), height: u.mm(qrSize), display: 'block' }} />
        ) : (
          <div style={{ width: u.mm(qrSize), height: u.mm(qrSize), background: '#f1f5f9' }} />
        )}
      </div>
    </CardShell>
  );
}

/** Card back: navy band, usage note, member since / ID, support contact, terms. */
export function CardBack({ unit = 'mm', name, memberCode, memberSince, verifyUrl, contactPhone, contactEmail, locale = 'en', labels = {} }) {
  const u = makeUnit(unit);
  const L = {
    memberId: 'Member ID', memberSince: 'Member since', support: 'Support', scan: 'Scan to verify',
    howTo: 'Present this card with a valid photo ID at any partner outlet to receive member pricing.',
    nonTransferable: 'This card is personal and non-transferable. Benefits are subject to partner terms.',
    ...labels,
  };
  return (
    <CardShell unit={unit}>
      <div style={{ position: 'absolute', left: 0, right: 0, top: u.mm(4.5), height: u.mm(7), background: 'linear-gradient(90deg, #0b1631, #1c2f5c)', borderBottom: `${u.mm(0.8)} solid ${GOLD}`, display: 'flex', alignItems: 'center', padding: `0 ${u.mm(5)}`, boxSizing: 'border-box' }}>
        {name && <div style={{ color: '#fff', fontSize: u.pt(8.4), fontWeight: 700, letterSpacing: '0.02em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{name}</div>}
      </div>
      {verifyUrl && (
        <div style={{ position: 'absolute', right: u.mm(5), top: u.mm(14.2), textAlign: 'center' }}>
          <div style={{ padding: u.mm(0.8), background: '#fff', borderRadius: u.mm(1), border: `${u.mm(0.2)} solid #e2e8f0`, lineHeight: 0 }}>
            <QRCodeSVG value={verifyUrl} size={256} level="M" fgColor={NAVY} bgColor="#ffffff" style={{ width: u.mm(17), height: u.mm(17), display: 'block' }} />
          </div>
          <div style={{ fontSize: u.pt(4.4), color: '#64748b', marginTop: u.mm(0.6), whiteSpace: 'nowrap' }}>{L.scan}</div>
        </div>
      )}
      <div style={{ position: 'absolute', left: u.mm(5), right: u.mm(verifyUrl ? 26 : 5), top: u.mm(14.5) }}>
        <div style={{ fontSize: u.pt(6.4), lineHeight: 1.45, color: '#334155' }}>{L.howTo}</div>
        <div style={{ display: 'flex', gap: u.mm(6), marginTop: u.mm(2.4) }}>
          <Field u={u} label={L.memberSince} value={memberSince ? date(memberSince, locale) : '—'} size={6.8} />
          <Field u={u} label={L.memberId} value={memberCode} mono size={6.8} />
        </div>
      </div>
      <div style={{ position: 'absolute', left: u.mm(5), right: u.mm(5), bottom: u.mm(3.6), borderTop: `${u.mm(0.2)} solid #e2e8f0`, paddingTop: u.mm(1.6), display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: u.mm(3) }}>
        <div style={{ fontSize: u.pt(5.4), lineHeight: 1.4, color: '#64748b' }}>
          {(contactPhone || contactEmail) && <div style={{ fontWeight: 600, color: NAVY }}>{L.support}</div>}
          {contactPhone && <div>{contactPhone}</div>}
          {contactEmail && <div>{contactEmail}</div>}
        </div>
        <div style={{ fontSize: u.pt(4.8), lineHeight: 1.4, color: '#94a3b8', textAlign: 'right', maxWidth: u.mm(42) }}>{L.nonTransferable}</div>
      </div>
    </CardShell>
  );
}
