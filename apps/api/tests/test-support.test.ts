import {
  errorResponseSchema,
  resetResponseSchema,
  testFaultStateSchema,
} from '@commerceops/contracts';
import { afterEach, describe, expect, it } from 'vitest';

import { buildApp } from '../src/app.js';
import { createTestDatabase } from './helpers/database.js';

describe('POST /api/test/reset', () => {
  const apps: ReturnType<typeof buildApp>[] = [];

  afterEach(async () => {
    await Promise.all(apps.splice(0).map(async (app) => app.close()));
  });

  it('does not exist when test support is disabled', async () => {
    const app = buildApp({ database: createTestDatabase() });
    apps.push(app);

    const response = await app.inject({
      method: 'POST',
      url: '/api/test/reset',
    });

    expect(response.statusCode).toBe(404);
    expect(errorResponseSchema.parse(response.json()).error.code).toBe(
      'NOT_FOUND',
    );

    const faults = await app.inject({ method: 'GET', url: '/api/test/faults' });
    expect(faults.statusCode).toBe(404);
  });

  it.each([undefined, 'invalid-test-token'])(
    'rejects a missing or invalid token (%s)',
    async (token) => {
      const app = buildApp({
        database: createTestDatabase(),
        testSupport: { enabled: true, token: 'test-support-token' },
      });
      apps.push(app);

      const response = await app.inject({
        method: 'POST',
        url: '/api/test/reset',
        ...(token === undefined
          ? {}
          : { headers: { 'x-test-support-token': token } }),
      });

      expect(response.statusCode).toBe(401);
      expect(errorResponseSchema.parse(response.json()).error.code).toBe(
        'TEST_SUPPORT_UNAUTHORIZED',
      );
    },
  );

  it('resets the database with a valid token', async () => {
    const app = buildApp({
      database: createTestDatabase(),
      testSupport: { enabled: true, token: 'test-support-token' },
    });
    apps.push(app);

    const response = await app.inject({
      method: 'POST',
      url: '/api/test/reset',
      headers: { 'x-test-support-token': 'test-support-token' },
    });

    expect(response.statusCode).toBe(200);
    expect(resetResponseSchema.parse(response.json())).toEqual({
      status: 'reset',
      data: { users: 2, products: 12, sessions: 0 },
    });
  });

  it('configures deterministic product faults through protected controls', async () => {
    const app = buildApp({
      database: createTestDatabase(),
      testSupport: { enabled: true, token: 'test-support-token' },
    });
    apps.push(app);
    const supportHeaders = { 'x-test-support-token': 'test-support-token' };

    await app.inject({
      method: 'POST',
      url: '/api/test/reset',
      headers: supportHeaders,
    });
    const login = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: { email: 'admin@commerceops.dev', password: 'Admin123!' },
    });
    const setCookie = login.headers['set-cookie'];
    if (typeof setCookie !== 'string')
      throw new Error('Missing session cookie.');
    const cookie = setCookie.split(';', 1)[0] ?? '';

    const requests = [
      {
        target: 'products.list',
        request: { method: 'GET' as const, url: '/api/products' },
      },
      {
        target: 'products.detail',
        request: {
          method: 'GET' as const,
          url: '/api/products/20000000-0000-4000-8000-000000000001',
        },
      },
      {
        target: 'products.write',
        request: {
          method: 'DELETE' as const,
          url: '/api/products/20000000-0000-4000-8000-000000000001',
        },
      },
    ] as const;

    for (const scenario of requests) {
      const enabled = await app.inject({
        method: 'PUT',
        url: '/api/test/faults',
        headers: supportHeaders,
        payload: { target: scenario.target, enabled: true },
      });
      expect(enabled.statusCode).toBe(200);
      expect(
        testFaultStateSchema.parse(enabled.json()).faults[scenario.target],
      ).toBe(true);

      const failed = await app.inject({
        ...scenario.request,
        headers: { cookie },
      });
      expect(failed.statusCode).toBe(503);
      expect(errorResponseSchema.parse(failed.json()).error).toMatchObject({
        code: 'TEST_FAULT_ACTIVE',
        details: { target: scenario.target },
      });

      await app.inject({
        method: 'PUT',
        url: '/api/test/faults',
        headers: supportHeaders,
        payload: { target: scenario.target, enabled: false },
      });
    }

    const state = await app.inject({
      method: 'GET',
      url: '/api/test/faults',
      headers: supportHeaders,
    });
    expect(testFaultStateSchema.parse(state.json()).faults).toEqual({
      'products.list': false,
      'products.detail': false,
      'products.write': false,
    });
  });

  it('validates fault controls and clears them during reset', async () => {
    const app = buildApp({
      database: createTestDatabase(),
      testSupport: { enabled: true, token: 'test-support-token' },
    });
    apps.push(app);
    const headers = { 'x-test-support-token': 'test-support-token' };

    const invalid = await app.inject({
      method: 'PUT',
      url: '/api/test/faults',
      headers,
      payload: { target: 'unknown', enabled: true },
    });
    expect(invalid.statusCode).toBe(400);

    await app.inject({
      method: 'PUT',
      url: '/api/test/faults',
      headers,
      payload: { target: 'products.list', enabled: true },
    });
    await app.inject({ method: 'POST', url: '/api/test/reset', headers });
    const state = await app.inject({
      method: 'GET',
      url: '/api/test/faults',
      headers,
    });

    expect(
      testFaultStateSchema.parse(state.json()).faults['products.list'],
    ).toBe(false);
  });
});
