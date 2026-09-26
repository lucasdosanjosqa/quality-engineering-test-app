import { useCallback, useEffect, useState } from 'react';

import { getHealth } from './api/health';

type HealthState =
  | { status: 'loading' }
  | { status: 'success'; service: string }
  | { status: 'error' };

export function App() {
  const [health, setHealth] = useState<HealthState>({ status: 'loading' });
  const [attempt, setAttempt] = useState(0);

  const retry = useCallback(() => {
    setHealth({ status: 'loading' });
    setAttempt((current) => current + 1);
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    async function checkHealth() {
      try {
        const response = await getHealth(controller.signal);
        setHealth({ status: 'success', service: response.service });
      } catch (error) {
        if (!(error instanceof DOMException && error.name === 'AbortError')) {
          setHealth({ status: 'error' });
        }
      }
    }

    void checkHealth();

    return () => {
      controller.abort();
    };
  }, [attempt]);

  return (
    <main>
      <h1>CommerceOps</h1>
      <p>Commerce operations built for reliable quality engineering.</p>

      <section aria-labelledby="system-status-heading">
        <h2 id="system-status-heading">System status</h2>

        {health.status === 'loading' && (
          <p role="status">Checking API availability…</p>
        )}

        {health.status === 'success' && (
          <p role="status">
            API available: <strong>{health.service}</strong>
          </p>
        )}

        {health.status === 'error' && (
          <div role="alert">
            <p>The API is unavailable. Check the service and try again.</p>
            <button type="button" onClick={retry}>
              Try again
            </button>
          </div>
        )}
      </section>
    </main>
  );
}
