import type { UserRole } from '@commerceops/contracts';
import { Navigate, Outlet, useLocation } from 'react-router';

import { useAuth } from './useAuth';

export function ProtectedRoute({ roles }: { roles?: UserRole[] }) {
  const { state, refresh } = useAuth();
  const location = useLocation();

  if (state.status === 'loading') {
    return <p role="status">Restoring your session…</p>;
  }
  if (state.status === 'error') {
    return (
      <div role="alert">
        <p>We could not verify your session.</p>
        <button type="button" onClick={refresh}>
          Try again
        </button>
      </div>
    );
  }
  if (state.status === 'guest') {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  if (roles !== undefined && !roles.includes(state.user.role)) {
    return (
      <section aria-labelledby="forbidden-heading">
        <h1 id="forbidden-heading">Access denied</h1>
        <p>You do not have permission to view this page.</p>
      </section>
    );
  }

  return <Outlet />;
}
