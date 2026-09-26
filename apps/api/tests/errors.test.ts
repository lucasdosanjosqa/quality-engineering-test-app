import { errorResponseSchema } from '@commerceops/contracts';
import { afterEach, describe, expect, it } from 'vitest';

import { buildApp } from '../src/app.js';
import { createTestDatabase } from './helpers/database.js';

describe('API errors', () => {
  const apps: ReturnType<typeof buildApp>[] = [];

  afterEach(async () => {
    await Promise.all(apps.splice(0).map(async (app) => app.close()));
  });

  it('returns the public error contract for an unknown route', async () => {
    const app = buildApp({ database: createTestDatabase() });
    apps.push(app);

    const response = await app.inject({ method: 'GET', url: '/api/unknown' });
    const body = errorResponseSchema.parse(response.json());

    expect(response.statusCode).toBe(404);
    expect(body.error).toMatchObject({
      code: 'NOT_FOUND',
      message: 'The requested resource was not found.',
    });
    expect(body.error.requestId).toEqual(expect.any(String));
  });

  it('maps Fastify schema failures to the public validation error', async () => {
    const app = buildApp({ database: createTestDatabase() });
    apps.push(app);
    app.get(
      '/api/validated',
      {
        schema: {
          querystring: {
            type: 'object',
            required: ['page'],
            properties: { page: { type: 'integer', minimum: 1 } },
          },
        },
      },
      () => ({ status: 'ok' }),
    );

    const response = await app.inject({
      method: 'GET',
      url: '/api/validated?page=zero',
    });
    const body = errorResponseSchema.parse(response.json());

    expect(response.statusCode).toBe(400);
    expect(body.error).toMatchObject({
      code: 'VALIDATION_ERROR',
      message: 'The request is invalid.',
    });
    expect(body.error.details).toBeUndefined();
  });
});
