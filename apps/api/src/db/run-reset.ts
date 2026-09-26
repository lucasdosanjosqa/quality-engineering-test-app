import { loadApiConfig } from '../config/env.js';
import { createDatabase } from './client.js';
import { migrateDatabase } from './migrate.js';
import { resetDatabase } from './reset.js';

const config = loadApiConfig();
const database = createDatabase(config.databaseFile);

try {
  migrateDatabase(database.db);
  const result = resetDatabase(database.db);
  console.info(`Database reset completed: ${JSON.stringify(result)}`);
} finally {
  database.close();
}
