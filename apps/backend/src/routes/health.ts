import type { FastifyInstance } from 'fastify';
import { pingDatabase } from '../db/database.js';

export default async function healthRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.get('/health', async () => ({
    status: 'OK',
    timestamp: new Date().toISOString(),
  }));

  fastify.get('/ready', async (_request, reply) => {
    const dbOk = await pingDatabase();
    if (!dbOk) {
      return reply.status(503).send({
        type: 'server_error',
        status: 'not_ready',
        database: 'disconnected',
      });
    }
    return { status: 'ready', database: 'connected', timestamp: new Date().toISOString() };
  });
}
