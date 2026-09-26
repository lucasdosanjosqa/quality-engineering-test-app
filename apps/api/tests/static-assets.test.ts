import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { errorResponseSchema } from '@commerceops/contracts';
import { afterEach, describe, expect, it } from 'vitest';

import { buildApp } from '../src/app.js';
import { createTestDatabase } from './helpers/database.js';

describe('production web assets', () => {
  const apps: ReturnType<typeof buildApp>[] = [];
  const directories: string[] = [];

  afterEach(async () => {
    await Promise.all(apps.splice(0).map(async (app) => app.close()));
    for (const directory of directories.splice(0)) {
      rmSync(directory, { recursive: true, force: true });
    }
  });

  function createWebDist(): string {
    const directory = mkdtempSync(join(tmpdir(), 'commerceops-web-'));
    const assets = join(directory, 'assets');
    mkdirSync(assets);
    writeFileSync(join(directory, 'index.html'), '<main>CommerceOps</main>');
    writeFileSync(join(assets, 'app.js'), 'console.log("CommerceOps");');
    directories.push(directory);
    return directory;
  }

  it('serves static files and the SPA fallback without masking API errors', async () => {
    const app = buildApp({
      database: createTestDatabase(),
      webDistDir: createWebDist(),
    });
    apps.push(app);

    const asset = await app.inject({ method: 'GET', url: '/assets/app.js' });
    expect(asset.statusCode).toBe(200);
    expect(asset.body).toContain('CommerceOps');

    const navigation = await app.inject({
      method: 'GET',
      url: '/products/product-001',
    });
    expect(navigation.statusCode).toBe(200);
    expect(navigation.headers['content-type']).toContain('text/html');
    expect(navigation.body).toBe('<main>CommerceOps</main>');

    const missingApi = await app.inject({
      method: 'GET',
      url: '/api/unknown',
    });
    expect(missingApi.statusCode).toBe(404);
    expect(errorResponseSchema.parse(missingApi.json()).error.code).toBe(
      'NOT_FOUND',
    );

    const apiRootWithQuery = await app.inject({
      method: 'GET',
      url: '/api?source=browser',
    });
    expect(apiRootWithQuery.statusCode).toBe(404);
    expect(errorResponseSchema.parse(apiRootWithQuery.json()).error.code).toBe(
      'NOT_FOUND',
    );
  });
});
