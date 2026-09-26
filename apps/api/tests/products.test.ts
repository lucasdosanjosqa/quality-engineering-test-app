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

const createdProductId = '20000000-0000-4000-8000-000000000099';
const fixedNow = new Date('2026-06-01T12:00:00.000Z');

const productInput = {
  sku: 'WRK-LAMP-001',
  name: 'Adjustable Desk Lamp',
  description: 'Dimmable desk lamp with adjustable color temperature.',
  category: 'workspace',
  priceCents: 7490,
  stockQuantity: 14,
  status: 'active',
} as const;

function createSeededApp() {
  const database = createTestDatabase();
  resetDatabase(database.db);
  return buildApp({
    database,
    now: () => fixedNow,
    createId: () => createdProductId,
  });
}

async function login(
  app: ReturnType<typeof buildApp>,
  role: 'admin' | 'viewer' = 'viewer',
): Promise<string> {
  const response = await app.inject({
    method: 'POST',
    url: '/api/auth/login',
    payload:
      role === 'admin'
        ? { email: 'admin@commerceops.dev', password: 'Admin123!' }
        : { email: 'viewer@commerceops.dev', password: 'Viewer123!' },
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

  it('returns product details to an authenticated Viewer', async () => {
    const app = createSeededApp();
    apps.push(app);
    const cookie = await login(app);

    const response = await app.inject({
      method: 'GET',
      url: '/api/products/20000000-0000-4000-8000-000000000001',
      headers: { cookie },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      product: {
        sku: 'ACC-USB-C-001',
        description: expect.any(String),
      },
    });
  });

  it('allows an Admin to create, update, and delete a product', async () => {
    const app = createSeededApp();
    apps.push(app);
    const cookie = await login(app, 'admin');

    const created = await app.inject({
      method: 'POST',
      url: '/api/products',
      headers: { cookie },
      payload: productInput,
    });
    expect(created.statusCode).toBe(201);
    expect(created.headers.location).toBe(`/api/products/${createdProductId}`);
    expect(created.json()).toMatchObject({
      product: {
        id: createdProductId,
        sku: productInput.sku,
        createdAt: fixedNow.toISOString(),
      },
    });

    const updated = await app.inject({
      method: 'PUT',
      url: `/api/products/${createdProductId}`,
      headers: { cookie },
      payload: { ...productInput, name: 'Updated Desk Lamp', stockQuantity: 8 },
    });
    expect(updated.statusCode).toBe(200);
    expect(updated.json()).toMatchObject({
      product: { name: 'Updated Desk Lamp', stockQuantity: 8 },
    });

    const deleted = await app.inject({
      method: 'DELETE',
      url: `/api/products/${createdProductId}`,
      headers: { cookie },
    });
    const missing = await app.inject({
      method: 'GET',
      url: `/api/products/${createdProductId}`,
      headers: { cookie },
    });
    expect(deleted.statusCode).toBe(204);
    expect(missing.statusCode).toBe(404);
  });

  it('forbids product mutations for a Viewer', async () => {
    const app = createSeededApp();
    apps.push(app);
    const cookie = await login(app);

    for (const request of [
      { method: 'POST' as const, url: '/api/products', payload: productInput },
      {
        method: 'PUT' as const,
        url: '/api/products/20000000-0000-4000-8000-000000000001',
        payload: productInput,
      },
      {
        method: 'DELETE' as const,
        url: '/api/products/20000000-0000-4000-8000-000000000001',
      },
    ]) {
      const response = await app.inject({ ...request, headers: { cookie } });
      expect(response.statusCode).toBe(403);
      expect(errorResponseSchema.parse(response.json()).error.code).toBe(
        'FORBIDDEN',
      );
    }
  });

  it('rejects invalid product input and duplicate SKUs', async () => {
    const app = createSeededApp();
    apps.push(app);
    const cookie = await login(app, 'admin');

    const invalid = await app.inject({
      method: 'POST',
      url: '/api/products',
      headers: { cookie },
      payload: { ...productInput, priceCents: -1 },
    });
    const duplicate = await app.inject({
      method: 'POST',
      url: '/api/products',
      headers: { cookie },
      payload: { ...productInput, sku: 'ACC-USB-C-001' },
    });

    expect(invalid.statusCode).toBe(400);
    expect(errorResponseSchema.parse(invalid.json()).error.code).toBe(
      'VALIDATION_ERROR',
    );
    expect(duplicate.statusCode).toBe(409);
    expect(errorResponseSchema.parse(duplicate.json()).error.code).toBe(
      'SKU_ALREADY_EXISTS',
    );
  });
});
