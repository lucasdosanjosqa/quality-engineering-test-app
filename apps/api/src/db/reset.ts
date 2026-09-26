import { count } from 'drizzle-orm';

import { seedProducts, seedUsers } from './seed-data.js';
import { products, sessions, users } from './schema.js';
import type { AppDatabase } from './client.js';

export type ResetResult = {
  users: 2;
  products: 12;
  sessions: 0;
};

export function resetDatabase(database: AppDatabase): ResetResult {
  database.transaction((transaction) => {
    transaction.delete(sessions).run();
    transaction.delete(products).run();
    transaction.delete(users).run();
    transaction.insert(users).values(seedUsers).run();
    transaction.insert(products).values(seedProducts).run();
  });

  const userCount = database
    .select({ value: count() })
    .from(users)
    .get()?.value;
  const productCount = database
    .select({ value: count() })
    .from(products)
    .get()?.value;
  const sessionCount = database
    .select({ value: count() })
    .from(sessions)
    .get()?.value;

  if (userCount !== 2 || productCount !== 12 || sessionCount !== 0) {
    throw new Error(
      'The deterministic database reset produced unexpected counts.',
    );
  }

  return { users: 2, products: 12, sessions: 0 };
}
