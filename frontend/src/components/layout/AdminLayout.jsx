import { Suspense, useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  BadgePercent, Building2, CreditCard, IdCard, ExternalLink, FileClock, FileText, Gauge, KeyRound, Layers, LogOut, Menu,
  MessageSquareText, MessagesSquare, Receipt, ScrollText, ShieldCheck, Smartphone, UserCog, Users, X,
} from 'lucide-react';
import { Avatar, Icon, PageLoader } from '../ui';
import NotificationBell from './NotificationBell';
import { FullLogo, useSignOut } from './PublicLayout';
import { usePermission } from '../../hooks';
import { usePendingApprovalsQuery, usePublicContentQuery } from '../../app/api';

const NAV = [
  { section: 'Overview', items: [{ to: '/admin', label: 'Dashboard', icon: Gauge, perm: 'dashboard.view', end: true }] },
  {
    section: 'Membership',
    items: [
      { to: '/admin/members', label: 'Members', icon: Users, perm: 'members.view' },
      { to: '/admin/cards', label: 'Member Cards', icon: IdCard, perm: 'cards.view' },
      { to: '/admin/tiers', label: 'Membership Tiers', icon: Layers, perm: 'tiers.view' },
      { to: '/admin/invoices', label: 'Payments & Invoices', icon: Receipt, perm: 'payments.view', badge: 'approvals' },
    ],
  },
  {
    section: 'Partner ecosystem',
    items: [
      { to: '/admin/partners', label: 'Partner Businesses', icon: Building2, perm: 'partners.view' },
      { to: '/admin/offers', label: 'Offers & Benefits', icon: BadgePercent, perm: 'offers.view' },
    ],
  },
  {
    section: 'Communication',
    items: [
      { to: '/admin/sms-templates', label: 'SMS Templates', icon: MessageSquareText, perm: 'sms.templates.manage|gateways.sms.view' },
      { to: '/admin/sms-logs', label: 'SMS Delivery Logs', icon: MessagesSquare, perm: 'sms.logs.view' },
      { to: '/admin/cms', label: 'CMS & Localization', icon: FileText, perm: 'cms.view' },
    ],
  },
  {
    section: 'Settings',
    items: [
      { to: '/admin/settings/payment-gateways', label: 'Payment Gateways', icon: CreditCard, perm: 'gateways.payment.view|gateways.payment.manage' },
      { to: '/admin/settings/sms-gateways', label: 'SMS Gateways', icon: Smartphone, perm: 'gateways.sms.view|gateways.sms.manage' },
      { to: '/admin/roles', label: 'Roles & Permissions', icon: ShieldCheck, perm: 'roles.view' },
      { to: '/admin/staff', label: 'Staff Accounts', icon: UserCog, perm: 'staff.view' },
      { to: '/admin/audit-logs', label: 'Audit Log', icon: FileClock, perm: 'audit.view' },
    ],
  },
];

function Sidebar({ onNavigate }) {
  const can = usePermission();
  const user = useSelector((s) => s.auth.user);
  const signOut = useSignOut();
  const { data: content } = usePublicContentQuery();
  const { data: pending } = usePendingApprovalsQuery(undefined, { skip: !can('payments.view'), pollingInterval: 60000 });

  return (
    <div className="flex h-full flex-col">
      <div className="brand-rule" />
      <div className="flex items-center justify-center border-b border-navy-800 px-4 py-2.5">
        <div className="rounded-lg bg-white px-2.5 py-1"><FullLogo to="/admin" className="h-[52px]" /></div>
      </div>
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {NAV.map((group) => {
          const items = group.items.filter((i) => can(i.perm));
          if (!items.length) return null;
          return (
            <div key={group.section} className="mb-5">
              <p className="mb-1.5 px-2 text-2xs font-semibold uppercase tracking-[0.08em] text-gold-300/80">{group.section}</p>
              <ul className="space-y-0.5">
                {items.map((item) => (
                  <li key={item.to}>
                    <NavLink
                      to={item.to}
                      end={item.end}
                      onClick={onNavigate}
                      className={({ isActive }) =>
                        `group flex items-center gap-2.5 rounded-md px-2 py-1.5 text-[13px] font-medium transition-colors ${
                          isActive ? 'bg-navy-800 text-white shadow-[inset_3px_0_0_theme(colors.gold.400)]' : 'text-navy-100 hover:bg-navy-800/70 hover:text-white'
                        }`
                      }
                    >
                      <Icon icon={item.icon} size={15} />
                      <span className="flex-1 truncate">{item.label}</span>
                      {item.badge === 'approvals' && pending?.count > 0 && (
                        <span className="rounded-full bg-gold-400 px-1.5 text-navy-950 text-2xs font-semibold tabular-nums text-white">{pending.count}</span>
                      )}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </nav>
      <div className="border-t border-navy-800 p-3">
        <Link to="/" className="mb-2 flex items-center gap-2 rounded-md px-2 py-1.5 text-xs font-medium text-navy-200 hover:bg-navy-800 hover:text-white">
          <Icon icon={ExternalLink} size={13} /> View public site
        </Link>
        <div className="flex items-center gap-2.5 rounded-md px-2 py-1.5">
          <Avatar name={user?.name} size={30} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-medium text-white">{user?.name}</p>
            <p className="flex items-center gap-1 truncate text-2xs text-gold-300/90">
              <Icon icon={KeyRound} size={10} />
              {user?.roles?.join(', ')}
            </p>
          </div>
          <button onClick={signOut} className="rounded-md p-1.5 text-navy-200 hover:bg-navy-800 hover:text-white" title="Sign out" aria-label="Sign out">
            <Icon icon={LogOut} size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  useEffect(() => { setMobileOpen(false); window.scrollTo({ top: 0, behavior: 'instant' }); }, [location.pathname]);

  return (
    <div className="min-h-screen bg-slate-50">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 bg-navy-900 lg:block">
        <Sidebar />
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-navy-900/30" onClick={() => setMobileOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-64 animate-fade-in bg-navy-900">
            <Sidebar onNavigate={() => setMobileOpen(false)} />
          </aside>
        </div>
      )}

      <div className="lg:pl-60">
        {/* Desktop top header */}
        <header className="sticky top-0 z-20 hidden h-14 items-center justify-between border-b border-slate-200 bg-white/90 px-8 backdrop-blur lg:flex">
          <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
            <span className="inline-block h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Live Workspace</span>
          </div>
          <div className="flex items-center gap-3">
            <NotificationBell />
          </div>
        </header>

        {/* Mobile top header */}
        <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-slate-200 bg-white/90 px-4 backdrop-blur lg:hidden">
          <div className="flex items-center gap-3">
            <button onClick={() => setMobileOpen(true)} className="rounded-md p-1.5 text-slate-600 hover:bg-slate-100" aria-label="Open menu">
              <Icon icon={mobileOpen ? X : Menu} size={18} />
            </button>
            <span className="flex items-center gap-1.5 text-sm font-semibold"><Icon icon={ScrollText} size={15} /> Admin</span>
          </div>
          <NotificationBell />
        </header>
        <main className="mx-auto max-w-[1400px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <Suspense fallback={<PageLoader />}>
            <div key={location.pathname} className="animate-page-in">
              <Outlet />
            </div>
          </Suspense>
        </main>
      </div>
    </div>
  );
}
