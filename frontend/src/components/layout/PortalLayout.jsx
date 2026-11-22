import { Suspense, useEffect } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { CreditCard, Gift, LogOut, Receipt, UserRound } from 'lucide-react';
import { Avatar, Icon, PageLoader } from '../ui';
import NotificationBell from './NotificationBell';
import LanguageSwitcher from './LanguageSwitcher';
import { FullLogo, ScrollToTopButton, useSignOut } from './PublicLayout';
import { useT } from '../../hooks';
import { usePublicContentQuery } from '../../app/api';

export default function PortalLayout() {
  const { t } = useT();
  const user = useSelector((s) => s.auth.user);
  const { data } = usePublicContentQuery();
  const signOut = useSignOut();
  const location = useLocation();
  useEffect(() => { window.scrollTo({ top: 0, behavior: 'instant' }); }, [location.pathname]);

  const nav = [
    { to: '/portal', label: t('portal.nav.card'), icon: CreditCard, end: true },
    { to: '/portal/benefits', label: t('portal.nav.benefits'), icon: Gift },
    { to: '/portal/billing', label: t('portal.nav.billing'), icon: Receipt },
    { to: '/portal/profile', label: t('portal.nav.profile'), icon: UserRound },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white">
        <div className="brand-rule" />
        <div className="mx-auto flex h-[64px] max-w-5xl items-center gap-4 px-4 sm:h-[72px] sm:px-6">
          <FullLogo className="h-11 sm:h-14" />
          <div className="ml-auto flex items-center gap-2 sm:gap-3">
            <NotificationBell />
            <LanguageSwitcher />
            <div className="hidden items-center gap-2 sm:flex">
              <Avatar name={user?.name} size={28} />
              <span className="max-w-[140px] truncate text-sm font-medium text-slate-700">{user?.name}</span>
            </div>
            <button onClick={signOut} className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 hover:text-navy-900" aria-label={t('nav.logout')} title={t('nav.logout')}>
              <Icon icon={LogOut} size={16} />
            </button>
          </div>
        </div>
        <nav className="mx-auto hidden max-w-5xl gap-1 overflow-x-auto overflow-y-hidden px-4 sm:flex sm:px-6">
          {nav.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.end}
              className={({ isActive }) =>
                `-mb-px inline-flex items-center gap-1.5 whitespace-nowrap border-b-2 px-3 py-2.5 text-sm font-medium transition-colors ${isActive ? 'border-gold-500 text-navy-900' : 'border-transparent text-slate-500 hover:text-navy-800'}`
              }
            >
              <Icon icon={n.icon} size={15} />
              {n.label}
            </NavLink>
          ))}
        </nav>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-6 pb-24 sm:py-8 sm:pb-8 sm:px-6">
        <Suspense fallback={<PageLoader />}>
          <div key={location.pathname} className="animate-page-in">
            <Outlet />
          </div>
        </Suspense>
      </main>
      <ScrollToTopButton />
      <PortalMobileBottomNav nav={nav} />
    </div>
  );
}

function PortalMobileBottomNav({ nav }) {
  return (
    <nav
      aria-label="Portal Navigation"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200/90 bg-white/95 shadow-[0_-4px_24px_rgba(0,0,0,0.07)] backdrop-blur-lg sm:hidden"
      style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 6px)' }}
    >
      <div className="mx-auto grid h-16 grid-cols-4 items-center px-1">
        {nav.map((n) => (
          <NavLink
            key={n.to}
            to={n.to}
            end={n.end}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center gap-1 py-1 text-center transition-colors ${
                isActive ? 'font-semibold text-navy-950' : 'text-slate-500 hover:text-navy-800'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <div className={`flex h-7 w-10 items-center justify-center rounded-full transition-all ${
                  isActive ? 'bg-gold-50 text-gold-600' : ''
                }`}>
                  <Icon icon={n.icon} size={19} className={isActive ? 'text-gold-600' : 'text-slate-500'} />
                </div>
                <span className="max-w-full truncate text-[10px] leading-none tracking-tight">
                  {n.label}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
