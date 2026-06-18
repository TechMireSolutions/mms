import { randomUUID } from 'node:crypto';
import fastify, { FastifyInstance } from 'fastify';
import { loadBackendEnv } from './config/loadEnv.js';
import { loadServerConfig } from './config/serverConfig.js';
import { initDb } from './db/database.js';
import { registerFrontendSpa } from './plugins/frontendSpa.js';
import { registerPlugins } from './plugins/index.js';
import { registerRoutes } from './routes/index.js';

loadBackendEnv();

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
  const spaActive = await registerFrontendSpa(app, config);

  // setNotFoundHandler must be called exactly once per Fastify instance.
  // In production with a built SPA, serve index.html for non-API routes so
  // client-side routing works. Otherwise return a stable JSON 404 shape.
  if (spaActive) {
    app.setNotFoundHandler(async (request, reply) => {
      const pathname = request.url.split('?')[0] ?? '';
      if (pathname.startsWith('/api') || pathname.startsWith('/uploads')) {
        return reply.status(404).send({ type: 'not_found', message: 'Not found' });
      }
      return reply.sendFile('index.html');
    });
  } else {
    app.setNotFoundHandler((_request, reply) => {
      reply.status(404).send({ type: 'not_found', message: 'Route not found' });
    });
  }

  return app;
}
