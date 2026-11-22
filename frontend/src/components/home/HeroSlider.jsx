import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Handshake, ShieldCheck, Star, Users } from 'lucide-react';
import Icon from '../ui/Icon';
import { useT } from '../../hooks';

const DEFAULT_BG = '/images/hero-bg.jpg';
const AUTOPLAY_MS = 7000;
const FALLBACK_STATS = { partners: 10, offers: 17, members: 26 };

/** Renders a CMS title where *word* is highlighted in royal gold. */
function Highlighted({ text }) {
  const parts = String(text || '').split(/\*(.+?)\*/g);
  return parts.map((part, i) =>
    i % 2 === 1 ? <span key={i} className="text-amber-400">{part}</span> : <Fragment key={i}>{part}</Fragment>
  );
}

/** Internal routes use the router; hash/absolute links stay plain anchors. */
function CtaLink({ to, className, children }) {
  if (!to) return null;
  if (/^https:\/\//.test(to)) return <a href={to} target="_blank" rel="noreferrer" className={className}>{children}</a>;
  if (to.startsWith('#')) return <a href={to} className={className}>{children}</a>;
  return <Link to={to} className={className}>{children}</Link>;
}

const prefersReducedMotion = () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

/**
 * CMS-driven hero slider.
 * slides: [{ id, badge, title, subtitle, cta_primary_label, cta_primary_url, cta_secondary_label, cta_secondary_url, background_url }]
 * (translatable fields are {en, si, ta}); stats: { partners, offers, members } from /public/content.
 */
export default function HeroSlider({ slides = [], stats, fallback }) {
  const { t, tr, locale } = useT();
  // Sinhala/Tamil glyphs run wider than Latin: step the display size down so lines stay clear of the artwork.
  const headline = locale === 'en' ? 'text-4xl sm:text-5xl lg:text-[52px]' : 'text-[2rem] sm:text-[2.6rem] lg:text-[44px]';
  const items = useMemo(() => (slides.length ? slides : fallback ? [fallback] : []), [slides, fallback]);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const count = items.length;
  const multi = count > 1;
  const regionRef = useRef(null);

  useEffect(() => { if (index >= count) setIndex(0); }, [count, index]);

  const go = useCallback((i) => setIndex(((i % count) + count) % count), [count]);

  useEffect(() => {
    if (!multi || paused || prefersReducedMotion()) return undefined;
    const id = setInterval(() => setIndex((i) => (i + 1) % count), AUTOPLAY_MS);
    return () => clearInterval(id);
  }, [multi, paused, count]);

  const onKeyDown = (e) => {
    if (!multi) return;
    if (e.key === 'ArrowRight') { e.preventDefault(); go(index + 1); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); go(index - 1); }
  };

  const statItems = [
    { key: 'partners', icon: Handshake, value: stats?.partners ?? FALLBACK_STATS.partners },
    { key: 'offers', icon: Star, value: stats?.offers ?? FALLBACK_STATS.offers },
    { key: 'members', icon: Users, value: stats?.members ?? FALLBACK_STATS.members },
  ];

  if (!count) return null;

  return (
    <section
      ref={regionRef}
      className="relative isolate overflow-hidden bg-[#061433] text-white lg:bg-[#020f39]"
      aria-roledescription="carousel"
      aria-label="Highlights"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={(e) => { if (!regionRef.current?.contains(e.relatedTarget)) setPaused(false); }}
      onKeyDown={onKeyDown}
    >
      {/*
        Backgrounds: artwork on desktop only (lg+), crossfaded per slide; plain navy below lg.
        The image is fitted to the section height and anchored right — never stretched to full width —
        and capped at 94% of its native height so it is always shown at or below its real resolution
        (sharp lettering). The left edge fades into the matching navy (#020f39) so wide screens stay seamless.
      */}
      {items.map((s, i) => (
        <div
          key={`bg-${s.id ?? i}`}
          aria-hidden="true"
          className={`absolute inset-0 -z-10 hidden transition-opacity duration-1000 ease-out lg:block ${i === index ? 'opacity-100' : 'opacity-0'}`}
        >
          <img
            src={s.background_url || DEFAULT_BG}
            alt=""
            draggable="false"
            decoding="async"
            fetchpriority={i === 0 ? 'high' : 'low'}
            className="absolute right-0 top-1/2 h-full max-h-[716px] w-auto max-w-none -translate-y-1/2 select-none [mask-image:linear-gradient(to_right,transparent,black_16%)]"
          />
        </div>
      ))}
      {/* Keeps the left column legible over any uploaded artwork. */}
      <div aria-hidden="true" className="absolute inset-y-0 left-0 -z-10 hidden w-3/5 bg-gradient-to-r from-[#061433]/80 via-[#061433]/40 to-transparent lg:block" />

      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="grid py-14 sm:py-16 lg:min-h-[600px] lg:items-center lg:py-20">
          {/* All slide contents share one grid cell so height never jumps between slides. */}
          <div className="grid lg:max-w-[560px]">
            {items.map((s, i) => {
              const active = i === index;
              return (
                <div
                  key={`slide-${s.id ?? i}`}
                  role="group"
                  aria-roledescription="slide"
                  aria-label={`${i + 1} / ${count}`}
                  aria-hidden={!active}
                  className={`col-start-1 row-start-1 transition-all duration-700 ease-out ${active ? 'visible translate-y-0 opacity-100' : 'invisible translate-y-2 opacity-0'}`}
                >
                  {tr(s.badge) && (
                    <p className="inline-flex items-center gap-2 rounded-full border border-amber-400/50 bg-[#0A1D45]/80 px-3.5 py-1.5 text-xs font-medium text-amber-300 backdrop-blur-sm">
                      <Icon icon={ShieldCheck} size={14} />
                      {tr(s.badge)}
                    </p>
                  )}
                  <h1 className={`mt-6 font-bold leading-[1.12] tracking-tight text-white ${headline}`}>
                    <Highlighted text={tr(s.title)} />
                  </h1>
                  {tr(s.subtitle) && <p className="mt-5 max-w-xl text-base leading-relaxed text-slate-300 sm:text-lg lg:max-w-[520px]">{tr(s.subtitle)}</p>}

                  <div className="mt-8 flex flex-wrap gap-3">
                    {tr(s.cta_primary_label) && (
                      <CtaLink
                        to={s.cta_primary_url || '/register'}
                        className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 px-6 py-3.5 text-sm font-semibold text-slate-950 shadow-lg shadow-amber-500/20 transition-colors hover:from-amber-300 hover:to-amber-400 focus-visible:ring-2 focus-visible:ring-amber-300"
                      >
                        {tr(s.cta_primary_label)}
                        <Icon icon={ChevronRight} size={17} />
                      </CtaLink>
                    )}
                    {tr(s.cta_secondary_label) && (
                      <CtaLink
                        to={s.cta_secondary_url || '/partners'}
                        className="inline-flex items-center gap-2 rounded-xl border border-amber-400/40 bg-[#0B1E46]/90 px-6 py-3.5 text-sm font-medium text-white transition-colors hover:bg-[#11295C] focus-visible:ring-2 focus-visible:ring-amber-300"
                      >
                        <Icon icon={Users} size={16} className="text-amber-400" />
                        {tr(s.cta_secondary_label)}
                      </CtaLink>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Live KPI strip (shared by all slides) */}
            <dl className="col-start-1 row-start-2 mt-10 grid max-w-xl grid-cols-3 border-t border-white/10 pt-6">
              {statItems.map((s, i) => (
                <div key={s.key} className={`flex items-center gap-3 ${i ? 'border-l border-white/10 pl-4 sm:pl-6' : ''}`}>
                  <Icon icon={s.icon} size={26} className="hidden shrink-0 text-amber-400 sm:block" />
                  <div className="min-w-0">
                    <dd className="font-display text-2xl font-bold tabular-nums text-white sm:text-[28px]">{s.value}+</dd>
                    <dt className="truncate text-xs text-slate-300 sm:text-sm">{t(`home.stats.${s.key}`)}</dt>
                  </div>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </div>

      {multi && (
        <>
          <div className="pointer-events-none absolute inset-x-0 bottom-5 flex justify-center gap-2 lg:bottom-7">
            {items.map((s, i) => (
              <button
                key={`dot-${s.id ?? i}`}
                type="button"
                onClick={() => go(i)}
                aria-label={`Go to slide ${i + 1}`}
                aria-current={i === index}
                className={`pointer-events-auto h-2 rounded-full transition-all ${i === index ? 'w-7 bg-amber-400' : 'w-2 bg-white/40 hover:bg-white/70'}`}
              />
            ))}
          </div>
          <button
            type="button"
            onClick={() => go(index - 1)}
            aria-label="Previous slide"
            className="absolute left-3 top-1/2 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-amber-400/30 bg-[#0A1D45]/70 text-white backdrop-blur-sm transition-colors hover:bg-[#11295C] md:flex xl:left-6"
          >
            <Icon icon={ChevronLeft} size={18} />
          </button>
          <button
            type="button"
            onClick={() => go(index + 1)}
            aria-label="Next slide"
            className="absolute right-3 top-1/2 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-amber-400/30 bg-[#0A1D45]/70 text-white backdrop-blur-sm transition-colors hover:bg-[#11295C] md:flex xl:right-6"
          >
            <Icon icon={ChevronRight} size={18} />
          </button>
        </>
      )}
      <div aria-hidden="true" className="absolute inset-x-0 bottom-0 h-[3px] bg-gradient-to-r from-amber-500 via-amber-300 to-amber-500" />
    </section>
  );
}
