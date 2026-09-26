import {
  errorResponseSchema,
  resetResponseSchema,
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
});
