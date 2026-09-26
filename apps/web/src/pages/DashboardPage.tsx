import { Link, useNavigate } from 'react-router';

import styles from '../App.module.css';
import { useAuth } from '../auth/useAuth';

export function DashboardPage() {
  const { state, logout } = useAuth();
  const navigate = useNavigate();

  if (state.status !== 'authenticated') {
    return null;
  }

  async function handleLogout() {
    await logout();
    void navigate('/login', { replace: true });
  }

  return (
    <main className={styles.pageLayout}>
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>CommerceOps</p>
          <h1>Operations dashboard</h1>
        </div>
        <button type="button" onClick={() => void handleLogout()}>
          Sign out
        </button>
      </header>

      <section className={styles.card} aria-labelledby="welcome-heading">
        <h2 id="welcome-heading">Welcome, {state.user.fullName}</h2>
        <p>
          Signed in as <strong>{state.user.role}</strong>.
        </p>
        {state.user.role === 'admin' && (
          <Link to="/admin">Open admin summary</Link>
        )}
      </section>
    </main>
  );
}
