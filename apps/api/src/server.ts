import { buildApp } from './app.js';
import { loadApiConfig } from './config/env.js';
import { createDatabase } from './db/client.js';
import { initializeDatabase } from './db/initialize.js';

const config = loadApiConfig();
const database = createDatabase(config.databaseFile);
initializeDatabase(database.db);
const app = buildApp({
  database,
  session: config.session,
  testSupport: config.testSupport,
  webDistDir: config.webDistDir,
});

try {
  await app.listen({ host: config.host, port: config.port });
  app.log.info(
    `CommerceOps API listening on http://${config.host}:${config.port}`,
  );
} catch (error) {
  app.log.error(error);
  process.exitCode = 1;
}
