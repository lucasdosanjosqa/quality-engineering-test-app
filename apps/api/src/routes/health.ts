import { healthResponseSchema } from '@commerceops/contracts';
import type { FastifyPluginAsync } from 'fastify';

export const healthRoutes: FastifyPluginAsync = (app) => {
  app.get('/health', async (_request, reply) => {
    const response = healthResponseSchema.parse({
      status: 'ok',
      service: 'commerceops-api',
    });

    return reply.code(200).send(response);
  });

  return Promise.resolve();
};
