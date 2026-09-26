import { useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router';

import styles from '../App.module.css';
import { useAuth } from '../auth/useAuth';

export function AppShell() {
  const { state, logout } = useAuth();
  const navigate = useNavigate();
  const [signingOut, setSigningOut] = useState(false);
  const [error, setError] = useState(false);

  if (state.status !== 'authenticated') return null;

  async function handleLogout(): Promise<void> {
    setSigningOut(true);
    setError(false);
    try {
      await logout();
      void navigate('/login', { replace: true });
    } catch {
      setSigningOut(false);
      setError(true);
    }
  }

  return (
    <>
      <a className={styles.skipLink} href="#main-content">
        Skip to main content
      </a>
      <header className={styles.siteHeader}>
        <Link className={styles.brand} to="/dashboard">
          CommerceOps
        </Link>
        <nav className={styles.primaryNavigation} aria-label="Primary">
          <NavLink to="/dashboard">Dashboard</NavLink>
          <NavLink to="/products">Products</NavLink>
          {state.user.role === 'admin' && <NavLink to="/admin">Admin</NavLink>}
        </nav>
        <div className={styles.userMenu}>
          <span>{state.user.fullName}</span>
          <button
            type="button"
            disabled={signingOut}
            onClick={() => void handleLogout()}
          >
            {signingOut ? 'Signing out…' : 'Sign out'}
          </button>
        </div>
      </header>
      {error && (
        <p className={styles.shellAlert} role="alert">
          Sign out failed. Try again.
        </p>
      )}
      <Outlet />
    </>
  );
}
