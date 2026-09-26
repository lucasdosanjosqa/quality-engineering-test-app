import { resolve } from 'node:path';

import fastifyStatic from '@fastify/static';
import type { FastifyInstance } from 'fastify';

export function registerStaticAssets(
  app: FastifyInstance,
  webDistDir: string,
): void {
  void app.register(fastifyStatic, {
    root: resolve(webDistDir),
    wildcard: false,
  });
}
