import { randomUUID } from 'node:crypto';
import fastify, { FastifyInstance } from 'fastify';
import { loadBackendEnv } from './config/loadEnv.js';
import { loadServerConfig } from './config/serverConfig.js';
import { initDb } from './db/database.js';
import { registerFrontendSpa } from './plugins/frontendSpa.js';
import { registerPlugins } from './plugins/index.js';
import { registerRoutes } from './routes/index.js';

loadBackendEnv();

/**
 * Builds the Fastify application instance.
 */
export async function buildApp(): Promise<FastifyInstance> {
  const config = loadServerConfig();

  const app = fastify({
    logger: { level: config.logLevel },
    trustProxy: config.trustProxy,
    bodyLimit: config.bodyLimit,
    requestTimeout: config.requestTimeoutMs,
    genReqId: (request) => {
      const incoming = request.headers['x-request-id'];
      if (typeof incoming === 'string' && incoming.length > 0) return incoming;
      return randomUUID();
    },
  });

  await initDb();
  await registerPlugins(app, config);
  await registerRoutes(app);
  await registerFrontendSpa(app, config);

  return app;
}
