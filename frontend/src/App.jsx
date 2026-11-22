import { Suspense, useEffect } from 'react';
import { lazyPage, useRouteLoading } from './lib/lazyPage';
import { Navigate, Route, Routes } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useMeQuery } from './app/api';
import { setUser } from './app/authSlice';
import { PageLoader, Toaster, TopProgress } from './components/ui';
import PublicLayout from './components/layout/PublicLayout';
import PortalLayout from './components/layout/PortalLayout';
import AdminLayout from './components/layout/AdminLayout';
import { GuestOnly, RequireAuth, RequireMember, RequirePermission, RequireStaff } from './components/layout/Guards';
import { usePermission } from './hooks';

// Public
const HomePage = lazyPage(() => import('./pages/public/HomePage'));
const PartnersPage = lazyPage(() => import('./pages/public/PartnersPage'));
const TermsPage = lazyPage(() => import('./pages/public/TermsPage'));
const PrivacyPage = lazyPage(() => import('./pages/public/PrivacyPage'));
const RefundPage = lazyPage(() => import('./pages/public/RefundPage'));
const ContactPage = lazyPage(() => import('./pages/public/ContactPage'));
const LoginPage = lazyPage(() => import('./pages/public/LoginPage'));
const ForgotPasswordPage = lazyPage(() => import('./pages/public/ForgotPasswordPage'));
const RegisterPage = lazyPage(() => import('./pages/public/RegisterPage'));
const VerifyPage = lazyPage(() => import('./pages/public/VerifyPage'));
const NotFoundPage = lazyPage(() => import('./pages/public/NotFoundPage'));

// Member portal
const PortalDashboard = lazyPage(() => import('./pages/portal/PortalDashboard'));
const BenefitsPage = lazyPage(() => import('./pages/portal/BenefitsPage'));
const BillingPage = lazyPage(() => import('./pages/portal/BillingPage'));
const CheckoutPage = lazyPage(() => import('./pages/portal/CheckoutPage'));
const PaymentResultPage = lazyPage(() => import('./pages/portal/PaymentResultPage'));
const ProfilePage = lazyPage(() => import('./pages/portal/ProfilePage'));

// Admin
const DashboardPage = lazyPage(() => import('./pages/admin/DashboardPage'));
const MembersPage = lazyPage(() => import('./pages/admin/MembersPage'));
const CardsPage = lazyPage(() => import('./pages/admin/CardsPage'));
const TiersPage = lazyPage(() => import('./pages/admin/TiersPage'));
const PartnersAdminPage = lazyPage(() => import('./pages/admin/PartnersPage'));
const OffersPage = lazyPage(() => import('./pages/admin/OffersPage'));
const InvoicesPage = lazyPage(() => import('./pages/admin/InvoicesPage'));
const PaymentGatewaysPage = lazyPage(() => import('./pages/admin/PaymentGatewaysPage'));
const SmsGatewaysPage = lazyPage(() => import('./pages/admin/SmsGatewaysPage'));
const SmsTemplatesPage = lazyPage(() => import('./pages/admin/SmsTemplatesPage'));
const SmsLogsPage = lazyPage(() => import('./pages/admin/SmsLogsPage'));
const CmsPage = lazyPage(() => import('./pages/admin/CmsPage'));
const RolesPage = lazyPage(() => import('./pages/admin/RolesPage'));
const StaffPage = lazyPage(() => import('./pages/admin/StaffPage'));
const AuditLogsPage = lazyPage(() => import('./pages/admin/AuditLogsPage'));

/** Hydrates the signed-in user from the token on load (and after permission changes). */
function useAuthBootstrap() {
  const dispatch = useDispatch();
  const token = useSelector((s) => s.auth.token);
  const { data } = useMeQuery(undefined, { skip: !token });
  useEffect(() => {
    if (data) dispatch(setUser(data));
  }, [data, dispatch]);
}

/** Staff without dashboard access land on the first screen they can use. */
const ADMIN_LANDING = [
  ['dashboard.view', null],
  ['members.view', 'members'],
  ['cards.view', 'cards'],
  ['partners.view', 'partners'],
  ['offers.view', 'offers'],
  ['payments.view', 'invoices'],
  ['gateways.payment.view|gateways.payment.manage', 'settings/payment-gateways'],
  ['gateways.sms.view|gateways.sms.manage', 'settings/sms-gateways'],
  ['sms.logs.view', 'sms-logs'],
  ['cms.view', 'cms'],
  ['roles.view', 'roles'],
];

function AdminHome() {
  const can = usePermission();
  const hit = ADMIN_LANDING.find(([perm]) => can(perm));
  if (!hit) return <RequirePermission perform="dashboard.view" />;
  if (hit[1] === null) return <DashboardPage />;
  return <Navigate to={`/admin/${hit[1]}`} replace />;
}

const guard = (perform, el) => <RequirePermission perform={perform}>{el}</RequirePermission>;

/** Gold top bar while the next page's code downloads (the current page stays visible meanwhile). */
function RouteProgress() {
  return useRouteLoading() ? <TopProgress /> : null;
}

export default function App() {
  useAuthBootstrap();

  return (
    <>
      <Suspense fallback={<PageLoader fullscreen delay={0} />}>
        <Routes>
          <Route element={<PublicLayout />}>
            <Route index element={<HomePage />} />
            <Route path="partners" element={<PartnersPage />} />
            <Route path="contact" element={<ContactPage />} />
            <Route path="terms" element={<TermsPage />} />
            <Route path="privacy" element={<PrivacyPage />} />
            <Route path="refund-policy" element={<RefundPage />} />
            <Route path="verify/:token" element={<VerifyPage />} />
            <Route path="login" element={<GuestOnly><LoginPage /></GuestOnly>} />
            <Route path="forgot-password" element={<GuestOnly><ForgotPasswordPage /></GuestOnly>} />
            <Route path="register" element={<GuestOnly><RegisterPage /></GuestOnly>} />
          </Route>

          <Route path="portal" element={<RequireAuth><RequireMember><PortalLayout /></RequireMember></RequireAuth>}>
            <Route index element={<PortalDashboard />} />
            <Route path="benefits" element={<BenefitsPage />} />
            <Route path="billing" element={<BillingPage />} />
            <Route path="checkout" element={<CheckoutPage />} />
            <Route path="payment/result" element={<PaymentResultPage />} />
            <Route path="profile" element={<ProfilePage />} />
          </Route>

          <Route path="admin" element={<RequireAuth><RequireStaff><AdminLayout /></RequireStaff></RequireAuth>}>
            <Route index element={<AdminHome />} />
            <Route path="members" element={guard('members.view', <MembersPage />)} />
            <Route path="cards" element={guard('cards.view', <CardsPage />)} />
            <Route path="tiers" element={guard('tiers.view', <TiersPage />)} />
            <Route path="partners" element={guard('partners.view', <PartnersAdminPage />)} />
            <Route path="offers" element={guard('offers.view', <OffersPage />)} />
            <Route path="invoices" element={guard('payments.view', <InvoicesPage />)} />
            <Route path="settings/payment-gateways" element={guard('gateways.payment.view|gateways.payment.manage', <PaymentGatewaysPage />)} />
            <Route path="settings/sms-gateways" element={guard('gateways.sms.view|gateways.sms.manage', <SmsGatewaysPage />)} />
            <Route path="sms-templates" element={guard('sms.templates.manage|gateways.sms.view', <SmsTemplatesPage />)} />
            <Route path="sms-logs" element={guard('sms.logs.view', <SmsLogsPage />)} />
            <Route path="cms" element={guard('cms.view', <CmsPage />)} />
            <Route path="roles" element={guard('roles.view', <RolesPage />)} />
            <Route path="staff" element={guard('staff.view', <StaffPage />)} />
            <Route path="audit-logs" element={guard('audit.view', <AuditLogsPage />)} />
          </Route>

          <Route element={<PublicLayout />}>
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </Suspense>
      <RouteProgress />
      <Toaster />
    </>
  );
}
