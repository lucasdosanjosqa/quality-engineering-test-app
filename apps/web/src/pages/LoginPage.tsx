import { useState, type FormEvent } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router';

import styles from '../App.module.css';
import { ApiError } from '../api/client';
import { useAuth } from '../auth/useAuth';

type LoginLocationState = { from?: string };

export function LoginPage() {
  const { state, login } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [error, setError] = useState<string>();
  const [submitting, setSubmitting] = useState(false);

  if (state.status === 'authenticated') {
    return <Navigate to="/dashboard" replace />;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(undefined);
    setSubmitting(true);
    const form = new FormData(event.currentTarget);
    const email = form.get('email');
    const password = form.get('password');

    try {
      await login({
        email: typeof email === 'string' ? email : '',
        password: typeof password === 'string' ? password : '',
      });
      const destination = (location.state as LoginLocationState | null)?.from;
      void navigate(destination ?? '/dashboard', { replace: true });
    } catch (loginError) {
      setError(
        loginError instanceof ApiError
          ? loginError.message
          : 'The sign-in request could not be completed.',
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className={styles.centeredLayout}>
      <section className={styles.card} aria-labelledby="login-heading">
        <p className={styles.eyebrow}>CommerceOps</p>
        <h1 id="login-heading">Sign in</h1>
        <p>Use your operations account to continue.</p>

        {error !== undefined && <p role="alert">{error}</p>}

        <form onSubmit={(event) => void handleSubmit(event)}>
          <label htmlFor="email">Email</label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="username"
            required
          />

          <label htmlFor="password">Password</label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
          />

          <button type="submit" disabled={submitting}>
            {submitting ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </section>
    </main>
  );
}
