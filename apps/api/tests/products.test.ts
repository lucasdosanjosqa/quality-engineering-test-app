import {
  errorResponseSchema,
  productListResponseSchema,
} from '@commerceops/contracts';
import { afterEach, describe, expect, it } from 'vitest';

import { buildApp } from '../src/app.js';
import { resetDatabase } from '../src/db/reset.js';
import { createTestDatabase } from './helpers/database.js';

function sessionCookie(response: { headers: Record<string, unknown> }): string {
  const value = response.headers['set-cookie'];
  if (typeof value !== 'string') {
    throw new Error('The response did not set a session cookie.');
  }
  return value.split(';', 1)[0] ?? '';
}

function createSeededApp() {
  const database = createTestDatabase();
  resetDatabase(database.db);
  return buildApp({ database });
}

async function login(app: ReturnType<typeof buildApp>): Promise<string> {
  const response = await app.inject({
    method: 'POST',
    url: '/api/auth/login',
    payload: { email: 'viewer@commerceops.dev', password: 'Viewer123!' },
  });
  return sessionCookie(response);
}

describe('product catalog', () => {
  const apps: ReturnType<typeof buildApp>[] = [];

  afterEach(async () => {
    await Promise.all(apps.splice(0).map(async (app) => app.close()));
  });

  it('requires an authenticated session', async () => {
    const app = createSeededApp();
    apps.push(app);

    const response = await app.inject({ method: 'GET', url: '/api/products' });

    expect(response.statusCode).toBe(401);
    expect(errorResponseSchema.parse(response.json()).error.code).toBe(
      'AUTHENTICATION_REQUIRED',
    );
  });

  it('returns deterministic first-page metadata and products', async () => {
    const app = createSeededApp();
    apps.push(app);
    const cookie = await login(app);

    const response = await app.inject({
      method: 'GET',
      url: '/api/products?pageSize=5',
      headers: { cookie },
    });
    const body = productListResponseSchema.parse(response.json());

    expect(response.statusCode).toBe(200);
    expect(body.pagination).toEqual({
      page: 1,
      pageSize: 5,
      totalItems: 12,
      totalPages: 3,
    });
    expect(body.items).toHaveLength(5);
    expect(body.items.map((product) => product.name)).toEqual([
      '24-inch QHD Monitor',
      '27-inch 4K Monitor',
      'Adjustable Standing Desk',
      'Aluminum Laptop Stand',
      'Compact Mechanical Keyboard',
    ]);
  });

  it('combines search and filters and supports descending sorting', async () => {
    const app = createSeededApp();
    apps.push(app);
    const cookie = await login(app);

    const response = await app.inject({
      method: 'GET',
      url: '/api/products?search=aud&category=audio&status=active&sortBy=price&sortOrder=desc&pageSize=5',
      headers: { cookie },
    });
    const body = productListResponseSchema.parse(response.json());

    expect(response.statusCode).toBe(200);
    expect(body.pagination.totalItems).toBe(2);
    expect(body.items.map((product) => product.sku)).toEqual([
      'AUD-HEAD-001',
      'AUD-MIC-001',
    ]);
  });

  it('returns an empty page when the requested page exceeds the result set', async () => {
    const app = createSeededApp();
    apps.push(app);
    const cookie = await login(app);

    const response = await app.inject({
      method: 'GET',
      url: '/api/products?page=4&pageSize=5',
      headers: { cookie },
    });
    const body = productListResponseSchema.parse(response.json());

    expect(response.statusCode).toBe(200);
    expect(body.items).toEqual([]);
    expect(body.pagination).toMatchObject({ page: 4, totalPages: 3 });
  });

  it('rejects invalid query parameters with the public error contract', async () => {
    const app = createSeededApp();
    apps.push(app);
    const cookie = await login(app);

    const response = await app.inject({
      method: 'GET',
      url: '/api/products?page=0&sortBy=unknown',
      headers: { cookie },
    });

    expect(response.statusCode).toBe(400);
    expect(errorResponseSchema.parse(response.json()).error.code).toBe(
      'VALIDATION_ERROR',
    );
  });
});
