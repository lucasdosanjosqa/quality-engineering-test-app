import { asc, count } from 'drizzle-orm';
import { describe, expect, it } from 'vitest';

import { resetDatabase } from '../src/db/reset.js';
import { initializeDatabase } from '../src/db/initialize.js';
import { products, sessions, users } from '../src/db/schema.js';
import { createTestDatabase } from './helpers/database.js';

describe('database foundation', () => {
  it('seeds a new database once without overwriting later changes', () => {
    const database = createTestDatabase();

    try {
      initializeDatabase(database.db);
      expect(
        database.db.select({ value: count() }).from(users).get()?.value,
      ).toBe(2);
      expect(
        database.db.select({ value: count() }).from(products).get()?.value,
      ).toBe(12);

      database.db.delete(products).run();
      initializeDatabase(database.db);

      expect(
        database.db.select({ value: count() }).from(products).get()?.value,
      ).toBe(0);
    } finally {
      database.close();
    }
  });

  it('applies migrations and resets to the deterministic baseline', () => {
    const database = createTestDatabase();

    try {
      expect(resetDatabase(database.db)).toEqual({
        users: 2,
        products: 12,
        sessions: 0,
      });

      const storedUsers = database.db
        .select({ email: users.email, role: users.role })
        .from(users)
        .orderBy(asc(users.email))
        .all();
      const storedProducts = database.db
        .select({ sku: products.sku, name: products.name })
        .from(products)
        .orderBy(asc(products.sku))
        .all();

      expect(storedUsers).toEqual([
        { email: 'admin@commerceops.dev', role: 'admin' },
        { email: 'viewer@commerceops.dev', role: 'viewer' },
      ]);
      expect(storedProducts).toHaveLength(12);
      expect(storedProducts[0]).toEqual({
        sku: 'ACC-MOUSE-001',
        name: 'Ergonomic Wireless Mouse',
      });

      database.db
        .insert(sessions)
        .values({
          id: '30000000-0000-4000-8000-000000000001',
          userId: '10000000-0000-4000-8000-000000000001',
          createdAt: new Date('2026-01-16T12:00:00.000Z'),
          expiresAt: new Date('2026-01-17T12:00:00.000Z'),
        })
        .run();

      expect(resetDatabase(database.db)).toEqual({
        users: 2,
        products: 12,
        sessions: 0,
      });
      expect(
        database.db.select({ value: count() }).from(sessions).get()?.value,
      ).toBe(0);
    } finally {
      database.close();
    }
  });

  it('enforces database constraints', () => {
    const database = createTestDatabase();

    try {
      resetDatabase(database.db);

      expect(() =>
        database.db
          .insert(products)
          .values({
            id: '20000000-0000-4000-8000-000000000099',
            sku: 'INVALID-PRICE',
            name: 'Invalid product',
            description: 'Used to verify the database constraint.',
            category: 'accessories',
            priceCents: -1,
            stockQuantity: 1,
            status: 'active',
            createdAt: new Date('2026-01-15T12:00:00.000Z'),
            updatedAt: new Date('2026-01-15T12:00:00.000Z'),
          })
          .run(),
      ).toThrow();
    } finally {
      database.close();
    }
  });
});
