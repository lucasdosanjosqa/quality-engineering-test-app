import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { App } from './App';

const adminUser = {
  id: '10000000-0000-4000-8000-000000000001',
  email: 'admin@commerceops.dev',
  fullName: 'Alex Morgan',
  role: 'admin',
} as const;

const viewerUser = {
  id: '10000000-0000-4000-8000-000000000002',
  email: 'viewer@commerceops.dev',
  fullName: 'Taylor Reed',
  role: 'viewer',
} as const;

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function apiError(status: number, code: string, message: string): Response {
  return jsonResponse(
    { error: { code, message, requestId: 'test-request' } },
    status,
  );
}

function openAt(path: string): void {
  window.history.pushState({}, '', path);
}

describe('authentication UI', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    window.history.pushState({}, '', '/');
  });

  it('redirects an unauthenticated visitor to the login page', async () => {
    openAt('/dashboard');
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      apiError(401, 'AUTHENTICATION_REQUIRED', 'Authentication is required.'),
    );

    render(<App />);

    expect(screen.getByRole('status')).toHaveTextContent(
      'Restoring your session',
    );
    expect(
      await screen.findByRole('heading', { name: 'Sign in' }),
    ).toBeVisible();
  });

  it('signs in and displays the Admin dashboard', async () => {
    openAt('/login');
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(
        apiError(401, 'AUTHENTICATION_REQUIRED', 'Authentication is required.'),
      )
      .mockResolvedValueOnce(jsonResponse({ user: adminUser }));

    render(<App />);

    fireEvent.change(await screen.findByLabelText('Email'), {
      target: { value: 'admin@commerceops.dev' },
    });
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'Admin123!' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(
      await screen.findByRole('heading', { name: 'Welcome, Alex Morgan' }),
    ).toBeVisible();
    expect(
      screen.getByRole('link', { name: 'Open admin summary' }),
    ).toBeVisible();
    expect(fetchMock).toHaveBeenLastCalledWith(
      '/api/auth/login',
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('restores a Viewer session without exposing Admin navigation', async () => {
    openAt('/dashboard');
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      jsonResponse({ user: viewerUser }),
    );

    render(<App />);

    expect(
      await screen.findByRole('heading', { name: 'Welcome, Taylor Reed' }),
    ).toBeVisible();
    expect(
      screen.queryByRole('link', { name: 'Open admin summary' }),
    ).not.toBeInTheDocument();
  });

  it('blocks a Viewer who navigates directly to the Admin route', async () => {
    openAt('/admin');
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      jsonResponse({ user: viewerUser }),
    );

    render(<App />);

    expect(
      await screen.findByRole('heading', { name: 'Access denied' }),
    ).toBeVisible();
  });

  it('loads the protected Admin summary', async () => {
    openAt('/admin');
    vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(jsonResponse({ user: adminUser }))
      .mockResolvedValueOnce(
        jsonResponse({ users: 2, products: 12, activeSessions: 1 }),
      );

    render(<App />);

    expect(
      await screen.findByRole('heading', { name: 'Admin summary' }),
    ).toBeVisible();
    await waitFor(() => expect(screen.getByText('12')).toBeInTheDocument());
    expect(screen.getByText('Products')).toBeInTheDocument();
  });

  it('shows the API login error without losing the form', async () => {
    openAt('/login');
    vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(
        apiError(401, 'AUTHENTICATION_REQUIRED', 'Authentication is required.'),
      )
      .mockResolvedValueOnce(
        apiError(
          401,
          'INVALID_CREDENTIALS',
          'The email or password is invalid.',
        ),
      );

    render(<App />);

    fireEvent.change(await screen.findByLabelText('Email'), {
      target: { value: 'admin@commerceops.dev' },
    });
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'wrong-password' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'The email or password is invalid.',
    );
    expect(screen.getByLabelText('Email')).toBeVisible();
  });

  it('signs out and returns to login', async () => {
    openAt('/dashboard');
    vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(jsonResponse({ user: adminUser }))
      .mockResolvedValueOnce(new Response(null, { status: 204 }));

    render(<App />);

    fireEvent.click(await screen.findByRole('button', { name: 'Sign out' }));

    expect(
      await screen.findByRole('heading', { name: 'Sign in' }),
    ).toBeVisible();
  });
});
