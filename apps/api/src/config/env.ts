import { z } from 'zod';

const envSchema = z.object({
  API_HOST: z.string().min(1).default('127.0.0.1'),
  API_PORT: z.coerce.number().int().min(1).max(65_535).default(3000),
});

export type ApiConfig = {
  host: string;
  port: number;
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
    host: result.data.API_HOST,
    port: result.data.API_PORT,
  };
}
