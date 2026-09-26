import { createDatabase, type DatabaseContext } from '../../src/db/client.js';
import { migrateDatabase } from '../../src/db/migrate.js';

export function createTestDatabase(): DatabaseContext {
  const database = createDatabase(':memory:');
  migrateDatabase(database.db);
  return database;
}
