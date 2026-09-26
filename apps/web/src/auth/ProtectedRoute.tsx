import type { UserRole } from '@commerceops/contracts';
import { Navigate, Outlet, useLocation } from 'react-router';

import { useAuth } from './useAuth';

export function ProtectedRoute({ roles }: { roles?: UserRole[] }) {
  const { state, refresh } = useAuth();
  const location = useLocation();

  if (state.status === 'loading') {
    return (
      <main id="main-content">
        <p role="status">Restoring your session…</p>
      </main>
    );
  }
  if (state.status === 'error') {
    return (
      <main id="main-content" role="alert">
        <p>We could not verify your session.</p>
        <button type="button" onClick={refresh}>
          Try again
        </button>
      </main>
    );
  }
  if (state.status === 'guest') {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  if (roles !== undefined && !roles.includes(state.user.role)) {
    return (
      <main id="main-content" aria-labelledby="forbidden-heading">
        <h1 id="forbidden-heading">Access denied</h1>
        <p>You do not have permission to view this page.</p>
      </main>
    );
  }

  return <Outlet />;
}
