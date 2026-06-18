import { buildApp } from './app.js';
import { closeDatabase } from './db/database.js';

/**
 * Boots the Fastify server by building the app and listening on the configured port.
 */
async function startServer(): Promise<void> {
  const app = await buildApp();
  const defaultPort = process.env.NODE_ENV === 'production' ? '5002' : '3000';
  const port = parseInt(process.env.PORT || defaultPort, 10);
  const host = process.env.HOST || '0.0.0.0';

  await app.listen({ port, host });
  app.log.info(`Backend server listening on http://${host}:${port}`);

  const shutdown = async (signal: string) => {
    app.log.info({ signal }, 'shutting down');
    try {
      await app.close();
      await closeDatabase();
      process.exit(0);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      app.log.error({ err: message }, 'shutdown failed');
      process.exit(1);
    }
  };

  process.on('SIGTERM', () => void shutdown('SIGTERM'));
  process.on('SIGINT', () => void shutdown('SIGINT'));
}

startServer().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error('Error starting backend server:', message);
  process.exit(1);
});
