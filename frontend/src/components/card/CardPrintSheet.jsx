import { createPortal } from 'react-dom';
import CardFront, { CardBack, CARD_MM, NAVY } from './CardFront';

/**
 * Staff print output for the card queue. Mounted only while a print job is open.
 *
 * layout="a4"   → 10 cards per A4 page (2 × 5), crop guides, optional mirrored back pages for duplex
 *                 (long-edge flip: each row's columns are swapped so backs land behind their fronts).
 * layout="cr80" → one card per page at 85.6 × 53.98 mm for PVC card printers (front, then back).
 *
 * Page boxes are set via named CSS pages in index.css (`@page a4sheet`, `@page cr80`).
 */
const PER_PAGE = 10;
const COLS = 2;
const GAP_X = 8; // mm
const GAP_Y = 3; // mm
const MARGIN_X = (210 - (COLS * CARD_MM.w + GAP_X)) / 2;
const MARGIN_Y = (297 - (5 * CARD_MM.h + 4 * GAP_Y)) / 2;

const chunk = (arr, n) => Array.from({ length: Math.ceil(arr.length / n) }, (_, i) => arr.slice(i * n, i * n + n));

function Front({ c, brand }) {
  return (
    <CardFront
      unit="mm"
      variant="id"
      name={c.name}
      memberCode={c.member_code}
      nic={c.nic}
      joinedAt={c.joined_at}
      tierSlug={c.tier?.slug}
      tierName={c.tier?.name?.en ?? ''}
      tierColor={c.tier?.color}
      expiresAt={c.expires_at}
      verifyUrl={c.verify_url}
      active
      brandSi={brand.si}
      brandEn={brand.en}
      logoUrl={brand.logo}
    />
  );
}

function Back({ c }) {
  return <CardBack unit="mm" name={c.name} verifyUrl={c.verify_url} memberCode={c.member_code} memberSince={c.joined_at} contactPhone={c.contact?.phone} contactEmail={c.contact?.email} />;
}

function A4Page({ cells, isLast }) {
  return (
    <div className="a4-page" style={{ width: '210mm', height: '297mm', position: 'relative', breakAfter: isLast ? 'auto' : 'page', overflow: 'hidden' }}>
      {cells.map((node, i) => {
        if (!node) return null;
        const col = i % COLS;
        const row = Math.floor(i / COLS);
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: `${MARGIN_X + col * (CARD_MM.w + GAP_X)}mm`,
              top: `${MARGIN_Y + row * (CARD_MM.h + GAP_Y)}mm`,
              outline: '0.15mm dashed #94a3b8',
              outlineOffset: '0.8mm',
              borderRadius: '3.4mm',
            }}
          >
            {node}
          </div>
        );
      })}
    </div>
  );
}

export default function CardPrintSheet({ cards, layout = 'a4', includeBack = true, brand }) {
  let pages;

  if (layout === 'cr80') {
    pages = cards.flatMap((c) => [
      <div key={`f${c.user_id}`} className="cr80-page"><Front c={c} brand={brand} /></div>,
      ...(includeBack ? [<div key={`b${c.user_id}`} className="cr80-page"><Back c={c} /></div>] : []),
    ]);
    return createPortal(<div className="print-sheet print-sheet--cr80" aria-hidden="true">{pages}</div>, document.body);
  }

  const groups = chunk(cards, PER_PAGE);
  pages = [];
  groups.forEach((group, gi) => {
    const isLastGroup = gi === groups.length - 1;
    pages.push(
      <A4Page key={`f${gi}`} isLast={isLastGroup && !includeBack} cells={group.map((c) => <Front key={c.user_id} c={c} brand={brand} />)} />
    );
    if (includeBack) {
      // Mirror columns per row for long-edge duplex so each back sits behind its front.
      const mirrored = Array.from({ length: PER_PAGE }, (_, i) => {
        const row = Math.floor(i / COLS);
        const col = i % COLS;
        const src = group[row * COLS + (COLS - 1 - col)];
        return src ? <Back key={src.user_id} c={src} /> : null;
      });
      pages.push(<A4Page key={`b${gi}`} isLast={isLastGroup} cells={mirrored} />);
    }
  });

  return createPortal(
    <div className="print-sheet print-sheet--a4" aria-hidden="true" style={{ fontFamily: 'Inter, "Noto Sans Sinhala", "Noto Sans Tamil", system-ui, sans-serif', color: NAVY }}>
      {pages}
    </div>,
    document.body
  );
}

export const sheetPagesFor = (count, layout, includeBack) =>
  layout === 'cr80' ? count * (includeBack ? 2 : 1) : Math.ceil(count / PER_PAGE) * (includeBack ? 2 : 1);
