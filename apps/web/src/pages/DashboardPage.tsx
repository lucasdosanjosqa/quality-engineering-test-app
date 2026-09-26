import { Link } from 'react-router';

import styles from '../App.module.css';
import { useAuth } from '../auth/useAuth';

export function DashboardPage() {
  const { state } = useAuth();

  if (state.status !== 'authenticated') {
    return null;
  }

  return (
    <main id="main-content" className={styles.pageLayout}>
      <p className={styles.eyebrow}>CommerceOps</p>
      <h1>Operations dashboard</h1>

      <section className={styles.card} aria-labelledby="welcome-heading">
        <h2 id="welcome-heading">Welcome, {state.user.fullName}</h2>
        <p>
          Signed in as <strong>{state.user.role}</strong>.
        </p>
        <Link to="/products">Browse products</Link>
        {state.user.role === 'admin' && (
          <Link to="/admin">Open admin summary</Link>
        )}
      </section>
    </main>
  );
}
