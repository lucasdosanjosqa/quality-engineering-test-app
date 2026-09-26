import { Link } from 'react-router';

import styles from '../App.module.css';

export function NotFoundPage() {
  return (
    <main id="main-content" className={styles.pageLayout}>
      <p className={styles.eyebrow}>404</p>
      <h1>Page not found</h1>
      <p>The requested page does not exist.</p>
      <Link to="/dashboard">Return to dashboard</Link>
    </main>
  );
}
