import {
  productListQuerySchema,
  productListResponseSchema,
} from '@commerceops/contracts';
import type { FastifyInstance } from 'fastify';

import { requireUser } from '../auth/routes.js';
import type { SessionService } from '../auth/session-service.js';
import type { AppDatabase } from '../db/client.js';
import { AppError } from '../errors/app-error.js';
import { ProductService } from './product-service.js';

export function registerProductRoutes(
  app: FastifyInstance,
  options: { database: AppDatabase; sessionService: SessionService },
): void {
  const productService = new ProductService(options.database);

  app.get('/api/products', async (request, reply) => {
    requireUser(request, options.sessionService);
    const query = productListQuerySchema.safeParse(request.query);
    if (!query.success) {
      throw new AppError(
        400,
        'VALIDATION_ERROR',
        'The request is invalid.',
        query.error.flatten(),
      );
    }

    return reply
      .code(200)
      .send(productListResponseSchema.parse(productService.list(query.data)));
  });
}
