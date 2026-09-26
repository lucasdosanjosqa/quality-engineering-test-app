import { createDatabase } from './client.js';
import { migrateDatabase } from './migrate.js';
import { loadApiConfig } from '../config/env.js';

const config = loadApiConfig();
const database = createDatabase(config.databaseFile);

try {
  migrateDatabase(database.db);
  console.info('Database migrations completed.');
} finally {
  database.close();
}
