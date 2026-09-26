import { buildApp } from './app.js';
import { loadApiConfig } from './config/env.js';

const config = loadApiConfig();
const app = buildApp();

try {
  await app.listen({ host: config.host, port: config.port });
  app.log.info(
    `CommerceOps API listening on http://${config.host}:${config.port}`,
  );
} catch (error) {
  app.log.error(error);
  process.exitCode = 1;
}
