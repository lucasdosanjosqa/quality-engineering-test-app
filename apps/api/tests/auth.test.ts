import { createHash } from 'node:crypto';

import {
  adminSummaryResponseSchema,
  authResponseSchema,
  errorResponseSchema,
} from '@commerceops/contracts';
import { afterEach, describe, expect, it } from 'vitest';

import { buildApp } from '../src/app.js';
import { resetDatabase } from '../src/db/reset.js';
import { sessions } from '../src/db/schema.js';
import { createTestDatabase } from './helpers/database.js';

const now = new Date('2026-02-01T12:00:00.000Z');

function sessionCookie(response: { headers: Record<string, unknown> }): string {
  const setCookie = response.headers['set-cookie'];
  if (typeof setCookie !== 'string') {
    throw new Error('The response did not set a session cookie.');
  }
  return setCookie.split(';', 1)[0] ?? '';
}

function createSeededApp() {
  const database = createTestDatabase();
  resetDatabase(database.db);
  const app = buildApp({ database, now: () => now });
  return { app, database };
}

describe('authentication and authorization', () => {
  const apps: ReturnType<typeof buildApp>[] = [];

  afterEach(async () => {
    await Promise.all(apps.splice(0).map(async (app) => app.close()));
  });

  it('creates an opaque cookie session and returns the current user', async () => {
    const { app } = createSeededApp();
    apps.push(app);

    const login = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: { email: 'ADMIN@COMMERCEOPS.DEV', password: 'Admin123!' },
    });
    const cookie = sessionCookie(login);

    expect(login.statusCode).toBe(200);
    expect(authResponseSchema.parse(login.json()).user).toMatchObject({
      email: 'admin@commerceops.dev',
      role: 'admin',
    });
    expect(login.headers['set-cookie']).toEqual(
      expect.stringContaining('HttpOnly'),
    );
    expect(login.headers['set-cookie']).toEqual(
      expect.stringContaining('SameSite=Lax'),
    );

    const me = await app.inject({
      method: 'GET',
      url: '/api/auth/me',
      headers: { cookie },
    });

    expect(me.statusCode).toBe(200);
    expect(authResponseSchema.parse(me.json()).user.email).toBe(
      'admin@commerceops.dev',
    );
  });

  it('returns the same invalid-credentials error for unknown users and bad passwords', async () => {
    const { app } = createSeededApp();
    apps.push(app);

    for (const payload of [
      { email: 'missing@commerceops.dev', password: 'Admin123!' },
      { email: 'admin@commerceops.dev', password: 'wrong-password' },
    ]) {
      const response = await app.inject({
        method: 'POST',
        url: '/api/auth/login',
        payload,
      });

      expect(response.statusCode).toBe(401);
      expect(errorResponseSchema.parse(response.json()).error).toMatchObject({
        code: 'INVALID_CREDENTIALS',
        message: 'The email or password is invalid.',
      });
    }
  });

  it('validates the login payload', async () => {
    const { app } = createSeededApp();
    apps.push(app);

    const response = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: { email: 'not-an-email', password: '' },
    });

    expect(response.statusCode).toBe(400);
    expect(errorResponseSchema.parse(response.json()).error.code).toBe(
      'VALIDATION_ERROR',
    );
  });

  it('invalidates the server session on logout', async () => {
    const { app } = createSeededApp();
    apps.push(app);

    const login = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: { email: 'viewer@commerceops.dev', password: 'Viewer123!' },
    });
    const cookie = sessionCookie(login);
    const logout = await app.inject({
      method: 'POST',
      url: '/api/auth/logout',
      headers: { cookie },
    });
    const me = await app.inject({
      method: 'GET',
      url: '/api/auth/me',
      headers: { cookie },
    });

    expect(logout.statusCode).toBe(204);
    expect(logout.headers['set-cookie']).toEqual(
      expect.stringContaining('Max-Age=0'),
    );
    expect(me.statusCode).toBe(401);
  });

  it('rejects and removes an expired session', async () => {
    const { app, database } = createSeededApp();
    apps.push(app);
    const token = 'known-expired-session-token';
    const tokenHash = createHash('sha256').update(token).digest('hex');
    database.db
      .insert(sessions)
      .values({
        id: tokenHash,
        userId: '10000000-0000-4000-8000-000000000001',
        createdAt: new Date('2026-01-31T10:00:00.000Z'),
        expiresAt: new Date('2026-02-01T11:59:59.000Z'),
      })
      .run();

    const response = await app.inject({
      method: 'GET',
      url: '/api/auth/me',
      headers: { cookie: `commerceops_session=${token}` },
    });

    expect(response.statusCode).toBe(401);
    expect(database.db.select().from(sessions).all()).toHaveLength(0);
  });

  it('allows Admin and forbids Viewer on the admin summary', async () => {
    const { app } = createSeededApp();
    apps.push(app);

    const adminLogin = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: { email: 'admin@commerceops.dev', password: 'Admin123!' },
    });
    const viewerLogin = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: { email: 'viewer@commerceops.dev', password: 'Viewer123!' },
    });

    const adminResponse = await app.inject({
      method: 'GET',
      url: '/api/admin/summary',
      headers: { cookie: sessionCookie(adminLogin) },
    });
    const viewerResponse = await app.inject({
      method: 'GET',
      url: '/api/admin/summary',
      headers: { cookie: sessionCookie(viewerLogin) },
    });

    expect(adminResponse.statusCode).toBe(200);
    expect(adminSummaryResponseSchema.parse(adminResponse.json())).toEqual({
      users: 2,
      products: 12,
      activeSessions: 2,
    });
    expect(viewerResponse.statusCode).toBe(403);
    expect(errorResponseSchema.parse(viewerResponse.json()).error.code).toBe(
      'FORBIDDEN',
    );
  });
});
