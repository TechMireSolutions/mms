import { existsSync } from 'node:fs';
import { join } from 'node:path';
import fastifyStatic from '@fastify/static';
import type { FastifyInstance } from 'fastify';
import type { ServerConfig } from '../config/serverConfig.js';
import { resolveBackendRoot } from '../config/loadEnv.js';

/** Production: serve built SPA from apps/frontend/dist on the API port (Apache → :3000 only). */
export async function registerFrontendSpa(
  app: FastifyInstance,
  config: ServerConfig,
): Promise<void> {
  if (!config.isProd) {
    return;
  }

  const distRoot = join(resolveBackendRoot(), '..', 'frontend', 'dist');
  const indexHtml = join(distRoot, 'index.html');
  if (!existsSync(indexHtml)) {
    app.log.warn({ distRoot }, 'Frontend dist missing — skipping SPA static hosting');
    return;
  }

  await app.register(fastifyStatic, {
    root: distRoot,
    prefix: '/',
    wildcard: false,
    decorateReply: true,
  });

  app.setNotFoundHandler(async (request, reply) => {
    const pathname = request.url.split('?')[0] ?? '';
    if (pathname.startsWith('/api') || pathname.startsWith('/uploads')) {
      return reply.status(404).send({ type: 'not_found', message: 'Not found' });
    }
    return reply.sendFile('index.html');
  });

  app.log.info({ distRoot }, 'Serving frontend SPA from backend');
}
