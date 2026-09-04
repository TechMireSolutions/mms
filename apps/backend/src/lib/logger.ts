import { pino, type Logger } from 'pino';

/**
 * Shared structured logger for non-Fastify contexts (worker daemon, bootstrap,
 * DB init, WebSocket pub/sub, queue dispatch). Fastify request handlers should
 * prefer `request.log` / `app.log` so logs carry request context; this logger
 * is for code paths that run outside a request lifecycle.
 *
 * Level follows `LOG_LEVEL` (defaults to `info`), matching the Fastify server
 * so worker and API logs are consistent.
 */
export const logger: Logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  base: {
    service: 'mms-backend',
  },
  // Keep the same pretty/JSON output as the Fastify logger (pino default).
});
