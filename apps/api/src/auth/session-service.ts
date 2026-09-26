import { createHash, randomBytes } from 'node:crypto';

import type { AuthenticatedUser, UserRole } from '@commerceops/contracts';
import { and, count, eq, gt, lt } from 'drizzle-orm';

import type { AppDatabase } from '../db/client.js';
import { products, sessions, users } from '../db/schema.js';
import { verifyPassword } from './password.js';

export type SessionConfig = {
  cookieSecure: boolean;
  ttlMinutes: number;
};

export type CreatedSession = {
  expiresAt: Date;
  token: string;
  user: AuthenticatedUser;
};

function hashSessionToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

function toAuthenticatedUser(user: {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
}): AuthenticatedUser {
  return {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    role: user.role,
  };
}

export class SessionService {
  constructor(
    private readonly database: AppDatabase,
    private readonly config: SessionConfig,
    private readonly now: () => Date = () => new Date(),
  ) {}

  login(email: string, password: string): CreatedSession | undefined {
    const user = this.database
      .select({
        id: users.id,
        email: users.email,
        fullName: users.fullName,
        passwordHash: users.passwordHash,
        role: users.role,
        status: users.status,
      })
      .from(users)
      .where(eq(users.email, email))
      .get();

    if (
      user === undefined ||
      user.status !== 'active' ||
      !verifyPassword(password, user.passwordHash)
    ) {
      return undefined;
    }

    const issuedAt = this.now();
    const expiresAt = new Date(
      issuedAt.getTime() + this.config.ttlMinutes * 60 * 1000,
    );
    const token = randomBytes(32).toString('base64url');

    this.database
      .delete(sessions)
      .where(
        and(eq(sessions.userId, user.id), lt(sessions.expiresAt, issuedAt)),
      )
      .run();
    this.database
      .insert(sessions)
      .values({
        id: hashSessionToken(token),
        userId: user.id,
        createdAt: issuedAt,
        expiresAt,
      })
      .run();

    return {
      expiresAt,
      token,
      user: toAuthenticatedUser(user),
    };
  }

  getUser(token: string | undefined): AuthenticatedUser | undefined {
    if (token === undefined) {
      return undefined;
    }

    const sessionId = hashSessionToken(token);
    const result = this.database
      .select({
        sessionId: sessions.id,
        expiresAt: sessions.expiresAt,
        id: users.id,
        email: users.email,
        fullName: users.fullName,
        role: users.role,
        status: users.status,
      })
      .from(sessions)
      .innerJoin(users, eq(sessions.userId, users.id))
      .where(eq(sessions.id, sessionId))
      .get();

    if (
      result === undefined ||
      result.status !== 'active' ||
      result.expiresAt.getTime() <= this.now().getTime()
    ) {
      if (result !== undefined) {
        this.database.delete(sessions).where(eq(sessions.id, sessionId)).run();
      }
      return undefined;
    }

    return toAuthenticatedUser(result);
  }

  logout(token: string | undefined): void {
    if (token !== undefined) {
      this.database
        .delete(sessions)
        .where(eq(sessions.id, hashSessionToken(token)))
        .run();
    }
  }

  getAdminSummary(): {
    users: number;
    products: number;
    activeSessions: number;
  } {
    const currentTime = this.now();
    return {
      users:
        this.database.select({ value: count() }).from(users).get()?.value ?? 0,
      products:
        this.database.select({ value: count() }).from(products).get()?.value ??
        0,
      activeSessions:
        this.database
          .select({ value: count() })
          .from(sessions)
          .where(gt(sessions.expiresAt, currentTime))
          .get()?.value ?? 0,
    };
  }
}

export { hashSessionToken };
