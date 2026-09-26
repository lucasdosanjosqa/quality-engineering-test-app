import { buildApp } from './app.js';
import { loadApiConfig } from './config/env.js';
import { createDatabase } from './db/client.js';
import { migrateDatabase } from './db/migrate.js';

const config = loadApiConfig();
const database = createDatabase(config.databaseFile);
migrateDatabase(database.db);
const app = buildApp({ database, testSupport: config.testSupport });

try {
  await app.listen({ host: config.host, port: config.port });
  app.log.info(
    `CommerceOps API listening on http://${config.host}:${config.port}`,
  );
} catch (error) {
  app.log.error(error);
  process.exitCode = 1;
}
