/**
 * Client-supplied JHM Privilege Card artwork (Silver / Gold / Platinum).
 *
 * The artwork files in /public/cards are the client's designs with the sample member ID and expiry
 * painted out; this component lays the real member ID and "valid thru" (MM/YY) back on top in the
 * same position. Everything is one SVG in 0.1 mm units on the CR80 card (856 × 540), so it scales
 * identically on screen (container-query sizing) and in print (real millimetres), and the text
 * prints as crisp vector type over the raster art.
 */
export const CARD_ART = {
  silver: '/cards/card-silver.jpg',
  gold: '/cards/card-gold.jpg',
  platinum: '/cards/card-platinum.jpg',
};

/** Pick the artwork for a tier by slug, falling back to its English name. Null → use the default design. */
export function cardArtFor(slug, name) {
  const keys = [slug, typeof name === 'object' ? name?.en : name].filter(Boolean).map((s) => String(s).trim().toLowerCase());
  for (const k of keys) {
    const hit = Object.keys(CARD_ART).find((t) => k === t || k.includes(t));
    if (hit) return CARD_ART[hit];
  }
  return null;
}

/** Resolve once every card artwork image is decoded, so window.print() never captures a blank card. */
let artReady;
export function ensureCardArt() {
  if (!artReady) {
    artReady = Promise.all(Object.values(CARD_ART).map((src) => new Promise((resolve) => {
      const img = new Image();
      img.onload = img.onerror = () => resolve();
      img.src = src;
      img.decode?.().then(resolve, resolve);
    })));
  }
  return artReady;
}

const mmYY = (iso) => {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return `${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getFullYear()).slice(-2)}`;
};

/*
 * Approximate advance widths (in em) for Inter Medium. Good enough to size the ID so it never reaches
 * "VALID THRU" — character count alone isn't, because M/W are far wider than digits or spaces.
 */
const GLYPH_EM = { ' ': 0.28, '-': 0.4, M: 0.86, W: 0.95, I: 0.3, J: 0.5 };
const emWidth = (text) => [...text].reduce((w, ch) => w + (GLYPH_EM[ch] ?? (/\d/.test(ch) ? 0.62 : 0.68)), 0);

const CODE_X = 42;
const CODE_MAX_WIDTH = 310; // the artwork's sample "JHMS 1251 3428" spans x 44–348; VALID THRU starts at 423
const CODE_LETTER_SPACING = 1.2;

export default function ArtworkCardFront({ unit = 'mm', art, memberCode, expiresAt, active = true, inactiveLabel = 'Inactive' }) {
  const code = memberCode || '—';
  // Largest size (up to the artwork's 41) at which the whole ID fits in the sample ID's space.
  const codeSize = Math.min(41, (CODE_MAX_WIDTH - CODE_LETTER_SPACING * code.length) / Math.max(emWidth(code), 1));
  const font = 'Inter, "Helvetica Neue", Arial, sans-serif';

  return (
    <div
      style={{
        position: 'relative', overflow: 'hidden', boxSizing: 'border-box',
        width: unit === 'mm' ? '85.6mm' : '100%',
        height: unit === 'mm' ? '53.98mm' : '100%',
        borderRadius: unit === 'mm' ? '3.18mm' : '3.7cqw',
        background: '#111',
      }}
    >
      <svg viewBox="0 0 856 540" preserveAspectRatio="none" style={{ display: 'block', width: '100%', height: '100%' }} role="img" aria-label={`Membership card ${code}`}>
        <image href={art} x="0" y="0" width="856" height="540" preserveAspectRatio="none" style={{ filter: active ? undefined : 'saturate(0.75) brightness(0.88)' }} />
        <g fill="#ffffff" fontFamily={font} fontWeight="500" style={{ fontVariantNumeric: 'tabular-nums' }}>
          <text x={CODE_X} y="466.5" fontSize={codeSize} letterSpacing={CODE_LETTER_SPACING} xmlSpace="preserve">{code}</text>
          <text x="423.5" y="466.5" fontSize="41" letterSpacing="1.2" fill={active ? '#ffffff' : '#fecaca'}>{mmYY(expiresAt)}</text>
        </g>
        {!active && (
          <g transform="translate(428 250) rotate(-12)">
            <rect x="-150" y="-34" width="300" height="68" rx="10" fill="rgba(225,29,72,0.92)" />
            <text x="0" y="13" textAnchor="middle" fontFamily={font} fontWeight="800" fontSize="38" letterSpacing="4" fill="#fff">{String(inactiveLabel).toUpperCase()}</text>
          </g>
        )}
      </svg>
    </div>
  );
}
