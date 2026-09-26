import { fileURLToPath } from 'node:url';

import { migrate } from 'drizzle-orm/node-sqlite/migrator';

import type { AppDatabase } from './client.js';

const migrationsFolder = fileURLToPath(
  new URL('../../drizzle', import.meta.url),
);

export function migrateDatabase(database: AppDatabase): void {
  migrate(database, { migrationsFolder });
}
