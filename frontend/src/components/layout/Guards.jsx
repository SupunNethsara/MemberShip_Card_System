import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { ShieldOff } from 'lucide-react';
import { usePermission } from '../../hooks';
import { EmptyState, PageLoader } from '../ui';

/** Requires a signed-in user; waits for /auth/me to hydrate before deciding. */
export function RequireAuth({ children }) {
  const { token, user } = useSelector((s) => s.auth);
  const location = useLocation();
  if (!token) return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  if (!user) return <PageLoader fullscreen />;
  return children ?? <Outlet />;
}

export function RequireStaff({ children }) {
  const user = useSelector((s) => s.auth.user);
  if (!user) return <PageLoader />;
  if (!user.is_staff) return <Navigate to="/portal" replace />;
  return children ?? <Outlet />;
}

export function RequireMember({ children }) {
  const user = useSelector((s) => s.auth.user);
  if (!user) return <PageLoader />;
  if (user.is_staff) return <Navigate to="/admin" replace />;
  return children ?? <Outlet />;
}

/** Frontend route guard (3rd enforcement layer after route middleware + policies). */
export function RequirePermission({ perform, children }) {
  const can = usePermission();
  if (!can(perform)) {
    return (
      <div className="surface">
        <EmptyState
          icon={ShieldOff}
          title="You don't have access to this area"
          description={`This screen requires the ${(Array.isArray(perform) ? perform : String(perform).split('|')).map((p) => `"${p}"`).join(' or ')} permission. Ask a Super Admin to grant it from Roles & Permissions.`}
        />
      </div>
    );
  }
  return children ?? <Outlet />;
}

export function GuestOnly({ children }) {
  const { token, user } = useSelector((s) => s.auth);
  if (token && user) return <Navigate to={user.is_staff ? '/admin' : '/portal'} replace />;
  return children ?? <Outlet />;
}
