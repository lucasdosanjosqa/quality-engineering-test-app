import { z } from 'zod';

const envSchema = z
  .object({
    API_HOST: z.string().min(1).default('127.0.0.1'),
    API_PORT: z.coerce.number().int().min(1).max(65_535).default(3000),
    DATABASE_FILE: z.string().min(1).default('./data/commerceops.sqlite'),
    SESSION_COOKIE_SECURE: z
      .enum(['true', 'false'])
      .default('false')
      .transform((value) => value === 'true'),
    SESSION_TTL_MINUTES: z.coerce.number().int().min(5).max(1440).default(60),
    TEST_SUPPORT_ENABLED: z
      .enum(['true', 'false'])
      .default('false')
      .transform((value) => value === 'true'),
    TEST_SUPPORT_TOKEN: z.string().min(16).optional(),
  })
  .superRefine((environment, context) => {
    if (
      environment.TEST_SUPPORT_ENABLED &&
      environment.TEST_SUPPORT_TOKEN === undefined
    ) {
      context.addIssue({
        code: 'custom',
        message: 'TEST_SUPPORT_TOKEN is required when test support is enabled.',
        path: ['TEST_SUPPORT_TOKEN'],
      });
    }
  });

export type ApiConfig = {
  databaseFile: string;
  host: string;
  port: number;
  session: {
    cookieSecure: boolean;
    ttlMinutes: number;
  };
  testSupport: {
    enabled: boolean;
    token?: string;
  };
};

export function loadApiConfig(
  environment: NodeJS.ProcessEnv = process.env,
): ApiConfig {
  const result = envSchema.safeParse(environment);

  if (!result.success) {
    throw new Error(
      `Invalid API configuration: ${z.prettifyError(result.error)}`,
    );
  }

  return {
    databaseFile: result.data.DATABASE_FILE,
    host: result.data.API_HOST,
    port: result.data.API_PORT,
    session: {
      cookieSecure: result.data.SESSION_COOKIE_SECURE,
      ttlMinutes: result.data.SESSION_TTL_MINUTES,
    },
    testSupport: {
      enabled: result.data.TEST_SUPPORT_ENABLED,
      token: result.data.TEST_SUPPORT_TOKEN,
    },
  };
}
