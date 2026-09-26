import Fastify, { type FastifyInstance } from 'fastify';

import type { DatabaseContext } from './db/client.js';
import { registerAuth } from './auth/routes.js';
import type { SessionConfig } from './auth/session-service.js';
import { registerErrorHandlers } from './errors/handlers.js';
import { registerProductRoutes } from './products/routes.js';
import { healthRoutes } from './routes/health.js';
import { testSupportRoutes } from './test-support/routes.js';

export type BuildAppOptions = {
  database: DatabaseContext;
  session?: SessionConfig;
  now?: () => Date;
  testSupport?: {
    enabled: boolean;
    token?: string;
  };
};

export function buildApp(options: BuildAppOptions): FastifyInstance {
  const app = Fastify({ logger: false });

  registerErrorHandlers(app);
  const sessionService = registerAuth(app, {
    database: options.database.db,
    session: options.session ?? { cookieSecure: false, ttlMinutes: 60 },
    now: options.now,
  });
  registerProductRoutes(app, {
    database: options.database.db,
    sessionService,
  });
  void app.register(healthRoutes, { prefix: '/api' });

  if (options.testSupport?.enabled === true) {
    if (options.testSupport.token === undefined) {
      throw new Error(
        'A test support token is required when test support is enabled.',
      );
    }

    void app.register(testSupportRoutes, {
      prefix: '/api/test',
      database: options.database.db,
      token: options.testSupport.token,
    });
  }

  app.addHook('onClose', () => {
    options.database.close();
  });

  return app;
}
