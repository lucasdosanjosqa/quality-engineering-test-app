import type { AdminSummaryResponse } from '@commerceops/contracts';
import { useEffect, useState } from 'react';
import { Link } from 'react-router';

import styles from '../App.module.css';
import { getAdminSummary } from '../api/client';

type SummaryState =
  | { status: 'loading' }
  | { status: 'success'; summary: AdminSummaryResponse }
  | { status: 'error' };

export function AdminPage() {
  const [state, setState] = useState<SummaryState>({ status: 'loading' });

  useEffect(() => {
    const controller = new AbortController();
    void getAdminSummary(controller.signal)
      .then((summary) => setState({ status: 'success', summary }))
      .catch((error: unknown) => {
        if (!(error instanceof DOMException && error.name === 'AbortError')) {
          setState({ status: 'error' });
        }
      });
    return () => controller.abort();
  }, []);

  return (
    <main id="main-content" className={styles.pageLayout}>
      <Link to="/dashboard">← Back to dashboard</Link>
      <h1>Admin summary</h1>
      {state.status === 'loading' && <p role="status">Loading summary…</p>}
      {state.status === 'error' && (
        <p role="alert">The summary could not be loaded.</p>
      )}
      {state.status === 'success' && (
        <dl className={styles.summaryGrid}>
          <div>
            <dt>Users</dt>
            <dd>{state.summary.users}</dd>
          </div>
          <div>
            <dt>Products</dt>
            <dd>{state.summary.products}</dd>
          </div>
          <div>
            <dt>Active sessions</dt>
            <dd>{state.summary.activeSessions}</dd>
          </div>
        </dl>
      )}
    </main>
  );
}
