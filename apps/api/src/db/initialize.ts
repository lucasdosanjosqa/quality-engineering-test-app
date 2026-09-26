import { count } from 'drizzle-orm';

import type { AppDatabase } from './client.js';
import { migrateDatabase } from './migrate.js';
import { resetDatabase } from './reset.js';
import { products, users } from './schema.js';

export function initializeDatabase(database: AppDatabase): void {
  migrateDatabase(database);

  const userCount = database
    .select({ value: count() })
    .from(users)
    .get()?.value;
  const productCount = database
    .select({ value: count() })
    .from(products)
    .get()?.value;

  if (userCount === 0 && productCount === 0) {
    resetDatabase(database);
  }
}
