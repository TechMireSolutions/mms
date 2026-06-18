import { existsSync } from 'node:fs';
import { join } from 'node:path';
import fastifyStatic from '@fastify/static';
import type { FastifyInstance } from 'fastify';
import type { ServerConfig } from '../config/serverConfig.js';
import { resolveBackendRoot } from '../config/loadEnv.js';

/** Production: serve built SPA static assets. Returns true when SPA is active. */
export async function registerFrontendSpa(
  app: FastifyInstance,
  config: ServerConfig,
): Promise<boolean> {
  if (!config.isProd) {
    return false;
  }

  const distRoot = join(resolveBackendRoot(), '..', 'frontend', 'dist');
  const indexHtml = join(distRoot, 'index.html');
  if (!existsSync(indexHtml)) {
    app.log.warn({ distRoot }, 'Frontend dist missing — skipping SPA static hosting');
    return false;
  }

  await app.register(fastifyStatic, {
    root: distRoot,
    prefix: '/',
    wildcard: false,
    decorateReply: true,
  });

  app.log.info({ distRoot }, 'Serving frontend SPA from backend');
  return true;
}
