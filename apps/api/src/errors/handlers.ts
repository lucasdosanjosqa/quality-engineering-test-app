import { errorResponseSchema } from '@commerceops/contracts';
import type { FastifyInstance } from 'fastify';

import { AppError } from './app-error.js';

function isFastifyValidationError(
  error: unknown,
): error is { validation: unknown[] } {
  return (
    typeof error === 'object' &&
    error !== null &&
    'validation' in error &&
    Array.isArray(error.validation)
  );
}

export function registerErrorHandlers(
  app: FastifyInstance,
  options: { serveSpa: boolean } = { serveSpa: false },
): void {
  app.setNotFoundHandler((request, reply) => {
    const [pathname] = request.url.split('?', 1);
    const isBrowserNavigation =
      (request.method === 'GET' || request.method === 'HEAD') &&
      pathname !== '/api' &&
      !pathname?.startsWith('/api/');

    if (options.serveSpa && isBrowserNavigation) {
      return reply.type('text/html').sendFile('index.html');
    }

    const response = errorResponseSchema.parse({
      error: {
        code: 'NOT_FOUND',
        message: 'The requested resource was not found.',
        requestId: request.id,
      },
    });

    return reply.code(404).send(response);
  });

  app.setErrorHandler((error, request, reply) => {
    const isAppError = error instanceof AppError;
    const isValidationError = isFastifyValidationError(error);
    const response = errorResponseSchema.parse({
      error: {
        code: isAppError
          ? error.code
          : isValidationError
            ? 'VALIDATION_ERROR'
            : 'INTERNAL_ERROR',
        message: isAppError
          ? error.message
          : isValidationError
            ? 'The request is invalid.'
            : 'An unexpected error occurred.',
        requestId: request.id,
        ...(isAppError && error.details !== undefined
          ? { details: error.details }
          : {}),
      },
    });

    if (!isAppError && !isValidationError) {
      request.log.error(error);
    }

    return reply
      .code(isAppError ? error.statusCode : isValidationError ? 400 : 500)
      .send(response);
  });
}
