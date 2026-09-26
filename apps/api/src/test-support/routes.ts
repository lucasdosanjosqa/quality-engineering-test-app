import {
  resetResponseSchema,
  testFaultRequestSchema,
  testFaultStateSchema,
} from '@commerceops/contracts';
import type { FastifyPluginAsync } from 'fastify';

import type { AppDatabase } from '../db/client.js';
import { resetDatabase } from '../db/reset.js';
import { AppError } from '../errors/app-error.js';
import { authorizeTestSupport } from './authorize.js';
import type { FaultController } from './fault-controller.js';

export type TestSupportRouteOptions = {
  database: AppDatabase;
  token: string;
  faults: FaultController;
};

export const testSupportRoutes: FastifyPluginAsync<TestSupportRouteOptions> = (
  app,
  options,
) => {
  function authorize(request: { headers: Record<string, unknown> }): void {
    const providedToken = request.headers['x-test-support-token'];
    authorizeTestSupport(
      typeof providedToken === 'string' ? providedToken : undefined,
      options.token,
    );
  }

  app.post('/reset', async (request, reply) => {
    authorize(request);

    options.faults.reset();
    const response = resetResponseSchema.parse({
      status: 'reset',
      data: resetDatabase(options.database),
    });

    return reply.code(200).send(response);
  });

  app.get('/faults', async (request, reply) => {
    authorize(request);
    return reply
      .code(200)
      .send(testFaultStateSchema.parse(options.faults.getState()));
  });

  app.put('/faults', async (request, reply) => {
    authorize(request);
    const input = testFaultRequestSchema.safeParse(request.body);
    if (!input.success) {
      throw new AppError(
        400,
        'VALIDATION_ERROR',
        'The request is invalid.',
        input.error.flatten(),
      );
    }
    return reply
      .code(200)
      .send(
        testFaultStateSchema.parse(
          options.faults.set(input.data.target, input.data.enabled),
        ),
      );
  });

  return Promise.resolve();
};
