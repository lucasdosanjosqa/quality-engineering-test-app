import { scryptSync, timingSafeEqual } from 'node:crypto';

const keyLength = 64;

export function createPasswordHash(password: string, salt: string): string {
  return `scrypt$${salt}$${scryptSync(password, salt, keyLength).toString('hex')}`;
}

export function verifyPassword(password: string, encodedHash: string): boolean {
  const [algorithm, salt, expectedHex, ...extraParts] = encodedHash.split('$');

  if (
    algorithm !== 'scrypt' ||
    salt === undefined ||
    expectedHex === undefined ||
    extraParts.length > 0
  ) {
    return false;
  }

  const expected = Buffer.from(expectedHex, 'hex');
  if (expected.length !== keyLength) {
    return false;
  }

  const actual = scryptSync(password, salt, keyLength);
  return timingSafeEqual(actual, expected);
}
