import process from 'node:process';
import { resolveBackendListenPort } from '@mms/shared';
import { buildApp } from './app.js';
import { closeDatabase } from './db/database.js';
import { startAuthArtifactPurgeScheduler } from './services/auth/authArtifactPurgeScheduler.js';
import { closeAllQueues } from './worker/queues/index.js';
import { disconnectRedis } from './lib/redis.js';
import { closeAllConnections } from './lib/livePush.js';
import { logger } from './lib/logger.js';

const FORCE_SHUTDOWN_TIMEOUT_MS = 10_000;

/**
 * Boots the Fastify server by building the app and listening on the configured port.
 */
async function startServer(): Promise<void> {
  const app = await buildApp();
  const port = resolveBackendListenPort(process.env);
  const host = process.env.HOST || '0.0.0.0';

  const stopArtifactPurge = startAuthArtifactPurgeScheduler(app.log);
  
  // Encapsulate all resource teardowns inside Fastify's native onClose lifecycle
  app.addHook('onClose', async () => {
    stopArtifactPurge();
    await closeAllQueues();
    await disconnectRedis();
    closeAllConnections();
    await closeDatabase();
  });

  await app.listen({ port, host });
  app.log.info(`Backend server listening on http://${host}:${port}`);

  let isShuttingDown = false;
  const shutdown = async (signal: string) => {
    if (isShuttingDown) return;
    isShuttingDown = true;

    process.removeAllListeners('SIGTERM');
    process.removeAllListeners('SIGINT');

    app.log.info({ signal }, 'shutting down');

    const forceExitTimer = setTimeout(() => {
      app.log.fatal('Graceful shutdown timed out; forcing exit');
      process.exit(1);
    }, FORCE_SHUTDOWN_TIMEOUT_MS);
    forceExitTimer.unref?.();

    try {
      await app.close();
      process.exit(0);
    } catch (error) {
      const message = error instanceof Error ? error.stack || error.message : String(error);
      app.log.error({ err: message }, 'shutdown failed');
      process.exit(1);
    }
  };

  process.on('unhandledRejection', (reason) => {
    const err =
      reason instanceof Error
        ? { message: reason.message, stack: reason.stack }
        : { message: String(reason) };
    app.log.error({ err }, 'unhandled rejection');
  });

  process.on('uncaughtException', (error) => {
    app.log.fatal({ err: error }, 'uncaught exception');
    void shutdown('uncaughtException');
  });

  process.on('SIGTERM', () => void shutdown('SIGTERM'));
  process.on('SIGINT', () => void shutdown('SIGINT'));
}

startServer().catch((error) => {
  const errDetails = error instanceof Error ? error.stack || error.message : String(error);
  logger.fatal({ err: errDetails }, 'Fatal error starting backend server');
  process.exit(1);
});
