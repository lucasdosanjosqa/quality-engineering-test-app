import { resetResponseSchema } from '@commerceops/contracts';
import type { FastifyPluginAsync } from 'fastify';

import type { AppDatabase } from '../db/client.js';
import { resetDatabase } from '../db/reset.js';
import { authorizeTestSupport } from './authorize.js';

export type TestSupportRouteOptions = {
  database: AppDatabase;
  token: string;
};

export const testSupportRoutes: FastifyPluginAsync<TestSupportRouteOptions> = (
  app,
  options,
) => {
  app.post('/reset', async (request, reply) => {
    const providedToken = request.headers['x-test-support-token'];
    authorizeTestSupport(
      typeof providedToken === 'string' ? providedToken : undefined,
      options.token,
    );

    const response = resetResponseSchema.parse({
      status: 'reset',
      data: resetDatabase(options.database),
    });

    return reply.code(200).send(response);
  });

  return Promise.resolve();
};
