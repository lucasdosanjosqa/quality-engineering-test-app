import cookie from '@fastify/cookie';
import {
  adminSummaryResponseSchema,
  authResponseSchema,
  loginRequestSchema,
  type AuthenticatedUser,
  type UserRole,
} from '@commerceops/contracts';
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';

import type { AppDatabase } from '../db/client.js';
import { AppError } from '../errors/app-error.js';
import { SessionService, type SessionConfig } from './session-service.js';

const sessionCookieName = 'commerceops_session';

export type AuthOptions = {
  database: AppDatabase;
  session: SessionConfig;
  now?: () => Date;
};

function requireUser(
  request: FastifyRequest,
  sessionService: SessionService,
  roles?: UserRole[],
): AuthenticatedUser {
  const user = sessionService.getUser(request.cookies[sessionCookieName]);

  if (user === undefined) {
    throw new AppError(
      401,
      'AUTHENTICATION_REQUIRED',
      'Authentication is required.',
    );
  }
  if (roles !== undefined && !roles.includes(user.role)) {
    throw new AppError(
      403,
      'FORBIDDEN',
      'You do not have permission to access this resource.',
    );
  }

  return user;
}

function setSessionCookie(
  reply: FastifyReply,
  token: string,
  expiresAt: Date,
  config: SessionConfig,
): void {
  reply.setCookie(sessionCookieName, token, {
    expires: expiresAt,
    httpOnly: true,
    maxAge: config.ttlMinutes * 60,
    path: '/',
    sameSite: 'lax',
    secure: config.cookieSecure,
  });
}

export function registerAuth(app: FastifyInstance, options: AuthOptions): void {
  const sessionService = new SessionService(
    options.database,
    options.session,
    options.now,
  );

  void app.register(cookie);

  app.post('/api/auth/login', async (request, reply) => {
    const input = loginRequestSchema.safeParse(request.body);
    if (!input.success) {
      throw new AppError(
        400,
        'VALIDATION_ERROR',
        'The request is invalid.',
        input.error.flatten(),
      );
    }

    const existingToken = request.cookies[sessionCookieName];
    sessionService.logout(existingToken);
    const session = sessionService.login(input.data.email, input.data.password);

    if (session === undefined) {
      throw new AppError(
        401,
        'INVALID_CREDENTIALS',
        'The email or password is invalid.',
      );
    }

    setSessionCookie(reply, session.token, session.expiresAt, options.session);
    return reply
      .code(200)
      .send(authResponseSchema.parse({ user: session.user }));
  });

  app.post('/api/auth/logout', async (request, reply) => {
    sessionService.logout(request.cookies[sessionCookieName]);
    reply.clearCookie(sessionCookieName, {
      httpOnly: true,
      path: '/',
      sameSite: 'lax',
      secure: options.session.cookieSecure,
    });
    return reply.code(204).send();
  });

  app.get('/api/auth/me', async (request, reply) => {
    const user = requireUser(request, sessionService);
    return reply.code(200).send(authResponseSchema.parse({ user }));
  });

  app.get('/api/admin/summary', async (request, reply) => {
    requireUser(request, sessionService, ['admin']);
    return reply
      .code(200)
      .send(adminSummaryResponseSchema.parse(sessionService.getAdminSummary()));
  });
}
