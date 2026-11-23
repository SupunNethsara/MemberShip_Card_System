import { Suspense, useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { ArrowUp, Clock, CreditCard, Home, Lock, LogOut, Mail, MapPin, Menu, MessageCircle, Phone, ShieldCheck, Store, User, UserPlus, X } from 'lucide-react';
import { SOCIAL_PLATFORMS, socialHref } from '../../lib/social';
import { Icon, PageLoader } from '../ui';
import LanguageSwitcher from './LanguageSwitcher';
import { useT } from '../../hooks';
import { usePublicContentQuery, useLogoutApiMutation } from '../../app/api';
import { logout } from '../../app/authSlice';
import { baseApi } from '../../app/baseApi';

export function useSignOut() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [logoutApi] = useLogoutApiMutation();
  return async () => {
    try { await logoutApi().unwrap(); } catch { /* token may already be invalid */ }
    dispatch(logout());
    dispatch(baseApi.util.resetApiState());
    navigate('/login');
  };
}

export function Brand({ to = '/', siteName, compact = false }) {
  const { tr } = useT();
  const { data } = usePublicContentQuery();
  const mark = data?.settings?.logo_url || '/brand/jeewanasaviya-logo.png';
  const name = tr(data?.content?.['brand.name']) || siteName || data?.settings?.site_name || 'Jeewanasaviya';
  const tagline = tr(data?.content?.['brand.tagline']);
  return (
    <Link to={to} className="flex min-w-0 items-center gap-2.5">
      <img src={mark} alt="" className="h-10 w-auto shrink-0 object-contain" />
      <span className="min-w-0 leading-tight">
        <span className="block whitespace-nowrap font-display text-[15px] font-bold tracking-tight text-navy-900">{name}</span>
        {!compact && tagline && <span className="hidden truncate text-2xs font-medium text-gold-700 sm:block">{tagline}</span>}
      </span>
    </Link>
  );
}

/** The complete emblem (shield, people, Sinhala name ribbon). Admin-replaceable via CMS › Site settings. */
export function FullLogo({ to = '/', className = 'h-16' }) {
  const { tr } = useT();
  const { data } = usePublicContentQuery();
  const src = data?.settings?.logo_url || '/brand/jeewanasaviya-logo.png';
  const name = tr(data?.content?.['brand.name']) || data?.settings?.site_name || 'Jeewanasaviya';
  return (
    <Link to={to} className="inline-flex shrink-0 items-center" aria-label={name}>
      <img src={src} alt={name} className={`w-auto object-contain ${className}`} />
    </Link>
  );
}

export default function PublicLayout() {
  const { t, tr } = useT();
  const user = useSelector((s) => s.auth.user);
  const { data, isLoading: contentLoading } = usePublicContentQuery();
  const [open, setOpen] = useState(false);
  const signOut = useSignOut();
  const location = useLocation();
  // New page → start at the top; #section links (Plans, FAQ) glide to their section once it has rendered.
  useEffect(() => {
    setOpen(false);
    if (!location.hash) { window.scrollTo({ top: 0, behavior: 'instant' }); return undefined; }
    const id = setTimeout(() => document.getElementById(location.hash.slice(1))?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 120);
    return () => clearTimeout(id);
  }, [location.pathname, location.hash]);
  const siteName = data?.settings?.site_name;

  const links = [
    { to: '/', label: t('nav.home'), end: true },
    { to: '/#plans', label: t('nav.plans'), hash: true },
    { to: '/partners', label: t('nav.partners') },
    { to: '/#faq', label: t('nav.faq'), hash: true },
    { to: '/contact', label: t('nav.contact') },
  ];

  // Header actions share one height (44px — a comfortable tap target) so the row lines up.
  const headerBtn = 'h-11 items-center gap-2 whitespace-nowrap rounded-lg px-4 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-gold-400';
  const linkCls = ({ isActive }) => `text-sm font-medium transition-colors ${isActive ? 'text-navy-900' : 'text-slate-600 hover:text-navy-900'}`;

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="brand-rule" />
        {/* Three-column bar: logo (left) · links (centre) · actions (right) */}
        <div className="mx-auto grid h-20 max-w-6xl grid-cols-[auto_1fr_auto] items-center gap-4 px-4 sm:px-6 md:h-24">
          <FullLogo className="h-[52px] sm:h-[66px] md:h-[84px]" />
          <nav className="hidden items-center justify-center gap-6 lg:flex">
            {links.map((l) =>
              l.hash ? (
                <Link key={l.to} to={l.to} className="text-sm font-medium text-slate-600 hover:text-navy-900">{l.label}</Link>
              ) : (
                <NavLink key={l.to} to={l.to} end={l.end} className={linkCls}>{l.label}</NavLink>
              )
            )}
          </nav>
          <span className="lg:hidden" aria-hidden="true" />
          <div className="flex items-center justify-end gap-2 sm:gap-3">
            <LanguageSwitcher size="lg" />
            {user ? (
              <>
                <Link to={user.is_staff ? '/admin' : '/portal'} className={`${headerBtn} hidden bg-navy-900 text-white hover:bg-navy-800 sm:inline-flex`}>
                  <Icon icon={CreditCard} size={16} />
                  {user.is_staff ? t('nav.admin') : t('nav.portal')}
                </Link>
                <button type="button" onClick={signOut} aria-label={t('nav.logout')} title={t('nav.logout')} className="hidden h-11 w-11 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-navy-900 sm:inline-flex">
                  <Icon icon={LogOut} size={18} />
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className={`${headerBtn} hidden text-navy-900 hover:bg-slate-100 sm:inline-flex`}>
                  {t('nav.login')}
                </Link>
                <Link to="/register" className={`${headerBtn} hidden bg-gold-400 font-semibold text-navy-950 hover:bg-gold-300 sm:inline-flex`}>
                  <Icon icon={UserPlus} size={17} />
                  {t('nav.join')}
                </Link>
              </>
            )}
            <button className="inline-flex h-11 w-11 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 lg:hidden" onClick={() => setOpen((o) => !o)} aria-label="Menu" aria-expanded={open}>
              <Icon icon={open ? X : Menu} size={22} />
            </button>
          </div>
        </div>
        {open && (
          <div className="border-t border-slate-200 bg-white px-4 py-3 lg:hidden">
            <nav className="flex flex-col gap-2.5">
              {links.map((l) => (
                <Link key={l.to} to={l.to} onClick={() => setOpen(false)} className="text-sm font-medium text-slate-700">{l.label}</Link>
              ))}
              <div className="my-1 border-t border-slate-100 pt-2 flex flex-col gap-2">
                <Link to="/terms" onClick={() => setOpen(false)} className="text-xs text-slate-500 hover:text-navy-900">{t('nav.terms')}</Link>
                <Link to="/privacy" onClick={() => setOpen(false)} className="text-xs text-slate-500 hover:text-navy-900">{t('nav.privacy')}</Link>
                <Link to="/refund-policy" onClick={() => setOpen(false)} className="text-xs text-slate-500 hover:text-navy-900">{t('nav.refund')}</Link>
              </div>
              {!user && <Link to="/login" onClick={() => setOpen(false)} className="text-sm font-medium text-slate-700">{t('nav.login')}</Link>}
              {!user && (
                <Link to="/register" onClick={() => setOpen(false)} className={`${headerBtn} mt-1 inline-flex w-full justify-center bg-gold-400 font-semibold text-navy-950 hover:bg-gold-300`}>
                  <Icon icon={UserPlus} size={17} />
                  {t('nav.join')}
                </Link>
              )}
              {user && (
                <button onClick={() => { setOpen(false); signOut(); }} className="flex items-center gap-2 text-left text-sm font-medium text-rose-600">
                  <Icon icon={LogOut} size={16} />
                  {t('nav.logout')}
                </button>
              )}
            </nav>
          </div>
        )}
      </header>

      <main className="flex-1 pb-16 md:pb-0">
        <Suspense fallback={<PageLoader />}>
          <div key={location.pathname} className="animate-page-in">
            <Outlet />
          </div>
        </Suspense>
      </main>

      <SiteFooter data={data} loading={contentLoading} siteName={siteName} />
      <ScrollToTopButton />
      <MobileBottomNav user={user} onMenuToggle={() => setOpen((o) => !o)} isMenuOpen={open} />
    </div>
  );
}

export function ScrollToTopButton() {
  const { t } = useT();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setVisible(window.scrollY > 300);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <button
      type="button"
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      aria-label={t('footer.backToTop')}
      title={t('footer.backToTop')}
      className={`fixed bottom-20 right-4 z-40 flex h-11 w-11 items-center justify-center rounded-full border border-navy-700 bg-navy-900 text-white shadow-md transition-all duration-200 hover:bg-navy-800 focus:outline-none focus:ring-2 focus:ring-gold-400 sm:right-6 md:bottom-6 ${
        visible ? 'translate-y-0 opacity-100 pointer-events-auto' : 'translate-y-4 opacity-0 pointer-events-none'
      }`}
    >
      <Icon icon={ArrowUp} size={18} />
    </button>
  );
}

export function MobileBottomNav({ user, onMenuToggle, isMenuOpen }) {
  const { t } = useT();
  const location = useLocation();

  const isHome = location.pathname === '/' && !location.hash;
  const isPlans = location.hash === '#plans';
  const isPartners = location.pathname === '/partners';
  const isPortal = location.pathname.startsWith('/portal') || location.pathname.startsWith('/admin');
  const isLogin = location.pathname === '/login';

  return (
    <nav
      aria-label="Mobile Navigation"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200/90 bg-white/95 shadow-[0_-4px_24px_rgba(0,0,0,0.07)] backdrop-blur-lg md:hidden"
      style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 6px)' }}
    >
      <div className="mx-auto grid h-16 grid-cols-5 items-center px-1">
        {/* 1. Home */}
        <Link
          to="/"
          className={`flex flex-col items-center justify-center gap-1 py-1 text-center transition-colors ${
            isHome ? 'font-semibold text-navy-950' : 'text-slate-500 hover:text-navy-800'
          }`}
        >
          <div className={`flex h-7 w-10 items-center justify-center rounded-full transition-all ${
            isHome ? 'bg-gold-50 text-gold-600' : ''
          }`}>
            <Icon icon={Home} size={19} className={isHome ? 'text-gold-600' : 'text-slate-500'} />
          </div>
          <span className="max-w-full truncate text-[10px] leading-none tracking-tight">
            {t('nav.home')}
          </span>
        </Link>

        {/* 2. Plans */}
        <Link
          to="/#plans"
          className={`flex flex-col items-center justify-center gap-1 py-1 text-center transition-colors ${
            isPlans ? 'font-semibold text-navy-950' : 'text-slate-500 hover:text-navy-800'
          }`}
        >
          <div className={`flex h-7 w-10 items-center justify-center rounded-full transition-all ${
            isPlans ? 'bg-gold-50 text-gold-600' : ''
          }`}>
            <Icon icon={ShieldCheck} size={19} className={isPlans ? 'text-gold-600' : 'text-slate-500'} />
          </div>
          <span className="max-w-full truncate text-[10px] leading-none tracking-tight">
            {t('nav.plans')}
          </span>
        </Link>

        {/* 3. Partners */}
        <Link
          to="/partners"
          className={`flex flex-col items-center justify-center gap-1 py-1 text-center transition-colors ${
            isPartners ? 'font-semibold text-navy-950' : 'text-slate-500 hover:text-navy-800'
          }`}
        >
          <div className={`flex h-7 w-10 items-center justify-center rounded-full transition-all ${
            isPartners ? 'bg-gold-50 text-gold-600' : ''
          }`}>
            <Icon icon={Store} size={19} className={isPartners ? 'text-gold-600' : 'text-slate-500'} />
          </div>
          <span className="max-w-full truncate text-[10px] leading-none tracking-tight">
            {t('nav.partners')}
          </span>
        </Link>

        {/* 4. Portal / Sign In */}
        {user ? (
          <Link
            to={user.is_staff ? '/admin' : '/portal'}
            className={`flex flex-col items-center justify-center gap-1 py-1 text-center transition-colors ${
              isPortal ? 'font-semibold text-navy-950' : 'text-slate-500 hover:text-navy-800'
            }`}
          >
            <div className={`flex h-7 w-10 items-center justify-center rounded-full transition-all ${
              isPortal ? 'bg-gold-50 text-gold-600' : ''
            }`}>
              <Icon icon={CreditCard} size={19} className={isPortal ? 'text-gold-600' : 'text-slate-500'} />
            </div>
            <span className="max-w-full truncate text-[10px] leading-none tracking-tight">
              {user.is_staff ? t('nav.admin') : t('nav.portal')}
            </span>
          </Link>
        ) : (
          <Link
            to="/login"
            className={`flex flex-col items-center justify-center gap-1 py-1 text-center transition-colors ${
              isLogin ? 'font-semibold text-navy-950' : 'text-slate-500 hover:text-navy-800'
            }`}
          >
            <div className={`flex h-7 w-10 items-center justify-center rounded-full transition-all ${
              isLogin ? 'bg-gold-50 text-gold-600' : ''
            }`}>
              <Icon icon={User} size={19} className={isLogin ? 'text-gold-600' : 'text-slate-500'} />
            </div>
            <span className="max-w-full truncate text-[10px] leading-none tracking-tight">
              {t('nav.login')}
            </span>
          </Link>
        )}

        {/* 5. More / Join */}
        {user ? (
          <button
            type="button"
            onClick={onMenuToggle}
            className={`flex flex-col items-center justify-center gap-1 py-1 text-center transition-colors ${
              isMenuOpen ? 'font-semibold text-gold-600' : 'text-slate-500 hover:text-navy-800'
            }`}
            aria-label="More options"
          >
            <div className={`flex h-7 w-10 items-center justify-center rounded-full transition-all ${
              isMenuOpen ? 'bg-gold-50 text-gold-600' : ''
            }`}>
              <Icon icon={isMenuOpen ? X : Menu} size={19} />
            </div>
            <span className="max-w-full truncate text-[10px] leading-none tracking-tight">
              {t('nav.more', 'More')}
            </span>
          </button>
        ) : (
          <Link
            to="/register"
            className="flex flex-col items-center justify-center gap-1 py-1 text-center"
          >
            <div className="flex h-7 w-10 items-center justify-center rounded-full bg-navy-900 text-gold-300 shadow-sm transition-transform active:scale-95">
              <Icon icon={UserPlus} size={15} />
            </div>
            <span className="max-w-full truncate text-[10px] font-semibold leading-none text-navy-900">
              {t('nav.join')}
            </span>
          </Link>
        )}
      </div>
    </nav>
  );
}

/** Footer: brand + social media, quick links, and every contact channel managed in Admin › CMS › Site settings. */
function SiteFooter({ data, loading, siteName }) {
  const { t, tr } = useT();
  const s = data?.settings || {};
  const social = SOCIAL_PLATFORMS.filter((p) => s.social?.[p.key]);
  const address = tr(data?.content?.['contact.address']);
  const hours = tr(data?.content?.['contact.hours']);
  const extra = s.contact_extra || [];
  const heading = 'mb-3 text-2xs font-semibold uppercase tracking-[0.08em] text-gold-300';
  const row = 'flex items-start gap-2.5';
  const link = 'break-all hover:text-white';

  return (
    <footer className="border-t-[3px] border-gold-400 bg-navy-900 text-navy-100">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:px-6 md:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1.1fr_1.3fr]">
        <div>
          <div className="inline-block rounded-lg bg-white p-2">
            <img src={s.logo_url || '/brand/jeewanasaviya-logo.png'} alt={siteName} className="h-20 w-auto object-contain" />
          </div>
          {data ? (
            <p className="mt-4 max-w-xs text-sm text-navy-200">{tr(data.content?.['footer.tagline'])}</p>
          ) : loading && (
            <div className="mt-4 max-w-xs space-y-2" aria-hidden="true">
              <div className="h-3.5 w-full animate-pulse rounded bg-navy-800" />
              <div className="h-3.5 w-2/3 animate-pulse rounded bg-navy-800" />
            </div>
          )}
          {social.length > 0 && (
            <div className="mt-6">
              <p className={heading}>{t('footer.follow')}</p>
              <ul className="flex flex-wrap gap-2">
                {social.map((p) => (
                  <li key={p.key}>
                    <a
                      href={socialHref(p.key, s.social[p.key])}
                      target="_blank"
                      rel="noreferrer noopener"
                      aria-label={p.label}
                      title={p.label}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-navy-700 bg-navy-800 text-navy-100 transition-colors hover:border-gold-400 hover:bg-gold-400 hover:text-navy-950"
                    >
                      <Icon icon={p.icon} size={16} />
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div>
          <p className={heading}>{t('footer.quickLinks', 'Quick Links')}</p>
          <ul className="space-y-2.5 text-sm text-navy-100">
            <li><Link to="/" className="hover:text-white transition-colors">{t('nav.home')}</Link></li>
            <li><Link to="/#plans" className="hover:text-white transition-colors">{t('nav.plans')}</Link></li>
            <li><Link to="/partners" className="hover:text-white transition-colors">{t('partners.title')}</Link></li>
            <li><Link to="/#faq" className="hover:text-white transition-colors">{t('nav.faq')}</Link></li>
            <li><Link to="/contact" className="hover:text-white transition-colors">{t('nav.contact')}</Link></li>
          </ul>
        </div>

        <div>
          <p className={heading}>{t('footer.legal', 'Legal & Policies')}</p>
          <ul className="space-y-2.5 text-sm text-navy-100">
            <li><Link to="/terms" className="hover:text-white transition-colors">{t('nav.terms')}</Link></li>
            <li><Link to="/privacy" className="hover:text-white transition-colors">{t('nav.privacy')}</Link></li>
            <li><Link to="/refund-policy" className="hover:text-white transition-colors">{t('nav.refund')}</Link></li>
          </ul>
        </div>

        <div>
          <p className={heading}>{t('footer.support')}</p>
          {!data && (
            loading ? (
              <ul className="space-y-3" aria-label={t('common.loading')}>
                {['w-4/5', 'w-3/5', 'w-2/3', 'w-1/2'].map((w) => <li key={w} className={`h-4 animate-pulse rounded bg-navy-800 ${w}`} />)}
              </ul>
            ) : (
              <p className="text-sm text-navy-300">{t('common.loadFailedTitle')}. <Link to="/contact" className="underline hover:text-white">{t('nav.contact')}</Link></p>
            )
          )}
          <ul className="space-y-3 text-sm text-navy-100">
            {address && <li className={row}><Icon icon={MapPin} size={15} className="mt-0.5 shrink-0 text-gold-300" /><span className="whitespace-pre-line text-navy-200">{address}</span></li>}
            {hours && <li className={row}><Icon icon={Clock} size={15} className="mt-0.5 shrink-0 text-gold-300" /><span className="text-navy-200">{hours}</span></li>}
            {s.contact_phone && <li className={row}><Icon icon={Phone} size={15} className="mt-0.5 shrink-0 text-gold-300" /><a href={`tel:${s.contact_phone.replace(/[^\d+]/g, '')}`} className={`${link} tabular-nums`}>{s.contact_phone}</a></li>}
            {s.contact_email && <li className={row}><Icon icon={Mail} size={15} className="mt-0.5 shrink-0 text-gold-300" /><a href={`mailto:${s.contact_email}`} className={link}>{s.contact_email}</a></li>}
            {s.social?.whatsapp && (
              <li className={row}>
                <Icon icon={MessageCircle} size={15} className="mt-0.5 shrink-0 text-gold-300" />
                <a href={socialHref('whatsapp', s.social.whatsapp)} target="_blank" rel="noreferrer noopener" className={`${link} tabular-nums`}>WhatsApp · {s.social.whatsapp}</a>
              </li>
            )}
            {extra.map((c, i) => (
              <li key={i} className={row}>
                <Icon icon={c.type === 'email' ? Mail : Phone} size={15} className="mt-0.5 shrink-0 text-gold-300" />
                <span className="min-w-0">
                  {tr(c.label) && <span className="block text-2xs uppercase tracking-wider text-navy-300">{tr(c.label)}</span>}
                  <a href={c.type === 'email' ? `mailto:${c.value}` : `tel:${c.value.replace(/[^\d+]/g, '')}`} className={`${link} ${c.type === 'phone' ? 'tabular-nums' : ''}`}>{c.value}</a>
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="border-t border-navy-800 pb-20 md:pb-4">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-4 text-xs text-navy-300 md:flex-row sm:px-6">
          <div className="flex flex-col sm:flex-row items-center gap-3 text-center sm:text-left">
            <p>© {new Date().getFullYear()} {siteName}. {t('footer.rights')}</p>
            <span className="hidden sm:inline text-navy-700">·</span>
            <div className="flex items-center gap-2 text-2xs text-navy-400">
              <Icon icon={Lock} size={11} className="text-emerald-400" />
              <span>{t('footer.securePayment')}</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {social.length > 0 && (
              <ul className="flex gap-3">
                {social.map((p) => (
                  <li key={p.key}><a href={socialHref(p.key, s.social[p.key])} target="_blank" rel="noreferrer noopener" aria-label={p.label} className="text-navy-300 hover:text-gold-300"><Icon icon={p.icon} size={14} /></a></li>
                ))}
              </ul>
            )}
            <button
              type="button"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="inline-flex items-center gap-1.5 rounded-full border border-navy-700 bg-navy-800 px-3 py-1.5 text-xs font-medium text-navy-200 transition-colors hover:border-gold-400 hover:bg-gold-400 hover:text-navy-950 focus:outline-none focus:ring-2 focus:ring-gold-400"
              title={t('footer.backToTop')}
            >
              <span>{t('footer.backToTop')}</span>
              <Icon icon={ArrowUp} size={13} />
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
