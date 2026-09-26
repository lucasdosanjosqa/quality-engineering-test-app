import {
  productListQuerySchema,
  productListResponseSchema,
  productInputSchema,
  productResponseSchema,
} from '@commerceops/contracts';
import type { FastifyInstance } from 'fastify';
import { z } from 'zod';

import { requireUser } from '../auth/routes.js';
import type { SessionService } from '../auth/session-service.js';
import type { AppDatabase } from '../db/client.js';
import { AppError } from '../errors/app-error.js';
import { ProductService } from './product-service.js';

export function registerProductRoutes(
  app: FastifyInstance,
  options: {
    database: AppDatabase;
    sessionService: SessionService;
    now?: () => Date;
    createId?: () => string;
  },
): void {
  const productService = new ProductService(
    options.database,
    options.now,
    options.createId,
  );

  function productId(value: unknown): string {
    const parsed = z.object({ id: z.string().uuid() }).safeParse(value);
    if (!parsed.success)
      throw new AppError(
        400,
        'VALIDATION_ERROR',
        'The request is invalid.',
        parsed.error.flatten(),
      );
    return parsed.data.id;
  }

  function productInput(value: unknown) {
    const parsed = productInputSchema.safeParse(value);
    if (!parsed.success)
      throw new AppError(
        400,
        'VALIDATION_ERROR',
        'The request is invalid.',
        parsed.error.flatten(),
      );
    return parsed.data;
  }

  function notFound(): never {
    throw new AppError(404, 'PRODUCT_NOT_FOUND', 'The product was not found.');
  }

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

  app.get('/api/products/:id', async (request, reply) => {
    requireUser(request, options.sessionService);
    const product = productService.get(productId(request.params));
    if (product === undefined) notFound();
    return reply.code(200).send(productResponseSchema.parse({ product }));
  });

  app.post('/api/products', async (request, reply) => {
    requireUser(request, options.sessionService, ['admin']);
    const product = productService.create(productInput(request.body));
    if (product === undefined)
      throw new AppError(
        409,
        'SKU_ALREADY_EXISTS',
        'A product with this SKU already exists.',
      );
    return reply
      .header('location', `/api/products/${product.id}`)
      .code(201)
      .send(productResponseSchema.parse({ product }));
  });

  app.put('/api/products/:id', async (request, reply) => {
    requireUser(request, options.sessionService, ['admin']);
    const product = productService.update(
      productId(request.params),
      productInput(request.body),
    );
    if (product === undefined) notFound();
    if (product === 'sku-conflict')
      throw new AppError(
        409,
        'SKU_ALREADY_EXISTS',
        'A product with this SKU already exists.',
      );
    return reply.code(200).send(productResponseSchema.parse({ product }));
  });

  app.delete('/api/products/:id', async (request, reply) => {
    requireUser(request, options.sessionService, ['admin']);
    if (!productService.delete(productId(request.params))) notFound();
    return reply.code(204).send();
  });
}
