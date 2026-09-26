import {
  healthResponseSchema,
  type HealthResponse,
} from '@commerceops/contracts';

export async function getHealth(signal?: AbortSignal): Promise<HealthResponse> {
  const response = await fetch('/api/health', { signal });

  if (!response.ok) {
    throw new Error(`Health request failed with status ${response.status}.`);
  }

  return healthResponseSchema.parse(await response.json());
}
