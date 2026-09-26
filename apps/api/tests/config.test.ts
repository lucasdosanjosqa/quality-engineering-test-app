import { describe, expect, it } from 'vitest';

import { loadApiConfig } from '../src/config/env.js';

describe('API configuration', () => {
  it('uses safe local defaults with test support disabled', () => {
    expect(loadApiConfig({})).toEqual({
      databaseFile: './data/commerceops.sqlite',
      webDistDir: undefined,
      host: '127.0.0.1',
      port: 3000,
      session: { cookieSecure: false, ttlMinutes: 60 },
      testSupport: { enabled: false, token: undefined },
    });
  });

  it('accepts production web assets and treats an empty support token as absent', () => {
    expect(
      loadApiConfig({
        WEB_DIST_DIR: '/app/apps/web/dist',
        TEST_SUPPORT_TOKEN: '',
      }),
    ).toMatchObject({
      webDistDir: '/app/apps/web/dist',
      testSupport: { enabled: false, token: undefined },
    });
  });

  it('requires a sufficiently long token when test support is enabled', () => {
    expect(() => loadApiConfig({ TEST_SUPPORT_ENABLED: 'true' })).toThrow(
      'TEST_SUPPORT_TOKEN is required',
    );
    expect(() =>
      loadApiConfig({
        TEST_SUPPORT_ENABLED: 'true',
        TEST_SUPPORT_TOKEN: 'short',
      }),
    ).toThrow('Too small');
  });

  it('accepts an enabled test support configuration with a valid token', () => {
    expect(
      loadApiConfig({
        DATABASE_FILE: ':memory:',
        TEST_SUPPORT_ENABLED: 'true',
        TEST_SUPPORT_TOKEN: 'test-support-token',
      }),
    ).toMatchObject({
      databaseFile: ':memory:',
      testSupport: { enabled: true, token: 'test-support-token' },
    });
  });
});
