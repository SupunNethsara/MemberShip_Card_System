import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ChevronLeft, ChevronRight, Handshake, Star, Users } from 'lucide-react';
import Icon from '../ui/Icon';
import { useT } from '../../hooks';

const AUTOPLAY_MS = 7000;

/**
 * Slide 1 is part of the site itself (not the CMS), so the hero is complete on first paint —
 * no waiting for the API, and it still shows if the API is down. Slides added in
 * Admin › CMS › Hero slides follow it, from position 2 onwards.
 */
export const BUILT_IN_SLIDE = {
  id: 'built-in',
  background_url: '/images/hero-gold-card.jpg',
  badge: {
    en: 'Protection • Savings • A Valuable Lifestyle',
    si: 'ආරක්ෂාව • ඉතුරුම් • වටිනා ජීවන රටාව',
    ta: 'பாதுகாப்பு • சேமிப்பு • மதிப்புமிக்க வாழ்க்கை முறை',
  },
  title: {
    en: 'One card for your *family’s* protection and everyday savings.',
    si: 'ඔබේ *පවුලේ* ආරක්ෂාවට සහ දෛනික ඉතුරුම්වලට එකම කාඩ්පතක්.',
    ta: 'உங்கள் *குடும்பத்தின்* பாதுகாப்புக்கும் அன்றாட சேமிப்புக்கும் ஒரே அட்டை.',
  },
  subtitle: {
    en: 'Jeewanasaviya members save on healthcare, medical services, groceries, fuel and everyday essentials at trusted partners across Sri Lanka — verified instantly with a QR code on your phone.',
    si: 'ජීවනසවිය සාමාජිකයින්ට ශ්‍රී ලංකාව පුරා විශ්වාසනීය හවුල්කරුවන් වෙතින් සෞඛ්‍ය, වෛද්‍ය සේවා, සිල්ලර බඩු, ඉන්ධන සහ දෛනික අවශ්‍යතා සඳහා ඉතුරුම් — ඔබගේ දුරකථනයේ QR කේතයෙන් ක්ෂණිකව තහවුරු කෙරේ.',
    ta: 'ஜீவனசவிய உறுப்பினர்கள் இலங்கை முழுவதும் நம்பகமான கூட்டாளர்களிடம் சுகாதாரம், மருத்துவ சேவைகள், மளிகை, எரிபொருள் மற்றும் அன்றாடத் தேவைகளில் சேமிக்கிறார்கள் — உங்கள் தொலைபேசியில் QR குறியீட்டால் உடனடியாக சரிபார்க்கப்படும்.',
  },
  cta_primary_label: { en: 'Become a member', si: 'සාමාජිකයෙකු වන්න', ta: 'உறுப்பினராகுங்கள்' },
  cta_primary_url: '/register',
  cta_secondary_label: { en: 'Browse partners', si: 'හවුල්කරුවන් බලන්න', ta: 'கூட்டாளர்களைப் பாருங்கள்' },
  cta_secondary_url: '/partners',
};

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
 * Homepage hero: the built-in slide, then any CMS slides.
 * slides: CMS slides [{ id, badge, title, subtitle, cta_*_label, cta_*_url, background_url }] (translatable fields are {en, si, ta}).
 * stats: { partners, offers, members } from /public/content; statsStatus: 'loading' | 'error' | 'ready'.
 */
export default function HeroSlider({ slides = [], stats, statsStatus = 'ready' }) {
  const { t, tr, locale } = useT();
  // Sinhala/Tamil glyphs run wider than Latin: step the display size down so lines stay clear of the artwork.
  const headline = locale === 'en' ? 'text-4xl sm:text-5xl lg:text-[52px]' : 'text-[2rem] sm:text-[2.6rem] lg:text-[44px]';
  const items = useMemo(() => [BUILT_IN_SLIDE, ...slides], [slides]);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const count = items.length;
  const multi = count > 1;
  const regionRef = useRef(null);
  // Artwork fades in once decoded instead of painting in strips while it downloads.
  const [loadedBg, setLoadedBg] = useState({});
  const markLoaded = (src) => setLoadedBg((m) => (m[src] ? m : { ...m, [src]: true }));

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
    { key: 'partners', icon: Handshake, value: stats?.partners },
    { key: 'offers', icon: Star, value: stats?.offers },
    { key: 'members', icon: Users, value: stats?.members },
  ];

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
        Backgrounds (lg+): artwork crossfaded per slide behind the text. Below lg it is a banner above the text (see below).
        The image is fitted to the section height and anchored right — never stretched to full width —
        and capped at 94% of its native height so it is always shown at or below its real resolution
        (sharp lettering). The left edge fades into the matching navy (#020f39) so wide screens stay seamless.
      */}
      {items.map((s, i) => {
        const src = s.background_url || BUILT_IN_SLIDE.background_url;
        return (
          <div
            key={`bg-${s.id ?? i}`}
            aria-hidden="true"
            className={`absolute inset-0 -z-10 hidden transition-opacity duration-1000 ease-out lg:block ${i === index && loadedBg[src] ? 'opacity-100' : 'opacity-0'}`}
          >
            <img
              src={src}
              alt=""
              draggable="false"
              decoding="async"
              loading={i === 0 ? 'eager' : 'lazy'}
              fetchpriority={i === 0 ? 'high' : 'low'}
              onLoad={() => markLoaded(src)}
              onError={() => markLoaded(src)}
              className="absolute right-0 top-1/2 h-full max-h-[716px] w-auto max-w-none -translate-y-1/2 select-none [mask-image:linear-gradient(to_right,transparent,black_16%)]"
            />
          </div>
        );
      })}
      {/* Keeps the left column legible over any uploaded artwork. */}
      <div aria-hidden="true" className="absolute inset-y-0 left-0 -z-10 hidden w-3/5 bg-gradient-to-r from-[#061433]/80 via-[#061433]/40 to-transparent lg:block" />

      {/*
        Below lg the artwork sits as a full-bleed banner above the text (never behind it, so copy stays legible).
        Cropped from the right, where the subject of the artwork is; the bottom fades into the section navy.
      */}
      <div aria-hidden="true" className="relative aspect-[16/11] w-full overflow-hidden sm:aspect-[2/1] lg:hidden">
        {items.map((s, i) => {
          const src = s.background_url || BUILT_IN_SLIDE.background_url;
          return (
            <img
              key={`mbg-${s.id ?? i}`}
              src={src}
              alt=""
              draggable="false"
              decoding="async"
              loading={i === 0 ? 'eager' : 'lazy'}
              onLoad={() => markLoaded(src)}
              onError={() => markLoaded(src)}
              className={`absolute inset-0 h-full w-full select-none object-cover object-right transition-opacity duration-1000 ease-out ${i === index && loadedBg[src] ? 'opacity-100' : 'opacity-0'}`}
            />
          );
        })}
        <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-[#061433] to-transparent" />
      </div>

      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="grid pb-14 pt-6 sm:pb-16 sm:pt-8 lg:min-h-[600px] lg:items-center lg:py-20">
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
                    <p className="flex items-center gap-3 text-[13px] font-medium text-amber-300">
                      <span aria-hidden="true" className="h-px w-8 bg-amber-400/70" />
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
                        className="group inline-flex items-center gap-2 rounded-lg bg-gold-400 px-6 py-3 text-sm font-semibold text-navy-950 transition-colors hover:bg-gold-300 focus-visible:ring-2 focus-visible:ring-gold-300"
                      >
                        {tr(s.cta_primary_label)}
                        <Icon icon={ArrowRight} size={16} className="transition-transform group-hover:translate-x-0.5" />
                      </CtaLink>
                    )}
                    {tr(s.cta_secondary_label) && (
                      <CtaLink
                        to={s.cta_secondary_url || '/partners'}
                        className="inline-flex items-center rounded-lg border border-white/25 px-6 py-3 text-sm font-medium text-white transition-colors hover:border-white/50 hover:bg-white/5 focus-visible:ring-2 focus-visible:ring-gold-300"
                      >
                        {tr(s.cta_secondary_label)}
                      </CtaLink>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Live KPI strip (shared by all slides): pulsing bars while loading, a dash if the numbers could not be fetched. */}
            <dl className="col-start-1 row-start-2 mt-10 grid max-w-xl grid-cols-3 border-t border-white/10 pt-6">
              {statItems.map((s, i) => (
                <div key={s.key} className={`flex items-center gap-3 ${i ? 'border-l border-white/10 pl-4 sm:pl-6' : ''}`}>
                  <Icon icon={s.icon} size={26} className="hidden shrink-0 text-amber-400 sm:block" />
                  <div className="min-w-0">
                    <dd className="font-display text-2xl font-bold tabular-nums text-white sm:text-[28px]">
                      {statsStatus === 'loading' ? <span className="my-1.5 block h-6 w-12 animate-pulse rounded bg-white/10 sm:h-7" aria-label={t('common.loading')} /> : s.value == null ? '—' : `${s.value}+`}
                    </dd>
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
            className="absolute left-3 top-1/2 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-[#0A1D45]/60 text-white transition-colors hover:border-white/40 hover:bg-[#0A1D45] md:flex xl:left-6"
          >
            <Icon icon={ChevronLeft} size={18} />
          </button>
          <button
            type="button"
            onClick={() => go(index + 1)}
            aria-label="Next slide"
            className="absolute right-3 top-1/2 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-[#0A1D45]/60 text-white transition-colors hover:border-white/40 hover:bg-[#0A1D45] md:flex xl:right-6"
          >
            <Icon icon={ChevronRight} size={18} />
          </button>
        </>
      )}
      <div aria-hidden="true" className="absolute inset-x-0 bottom-0 h-[3px] bg-gold-400" />
    </section>
  );
}
