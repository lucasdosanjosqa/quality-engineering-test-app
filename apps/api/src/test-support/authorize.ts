import { createHash, timingSafeEqual } from 'node:crypto';

import { AppError } from '../errors/app-error.js';

export function authorizeTestSupport(
  providedToken: string | undefined,
  expectedToken: string,
): void {
  if (providedToken === undefined) {
    throw new AppError(
      401,
      'TEST_SUPPORT_UNAUTHORIZED',
      'A valid test support token is required.',
    );
  }

  const provided = createHash('sha256').update(providedToken).digest();
  const expected = createHash('sha256').update(expectedToken).digest();
  const isValid = timingSafeEqual(provided, expected);

  if (!isValid) {
    throw new AppError(
      401,
      'TEST_SUPPORT_UNAUTHORIZED',
      'A valid test support token is required.',
    );
  }
}
