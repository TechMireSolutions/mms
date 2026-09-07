import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { pingDatabase } from '../../db/database.js';

const healthResponseSchema = z.object({
  status: z.string(),
  timestamp: z.string(),
});

const readyResponseSchema = z.object({
  status: z.string(),
  database: z.string(),
  timestamp: z.string(),
});

const readyErrorResponseSchema = z.object({
  type: z.string(),
  status: z.string(),
  database: z.string(),
});

export default async function healthRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.get(
    '/health',
    {
      schema: {
        response: {
          200: healthResponseSchema,
        },
      },
    },
    async () => ({
      status: 'OK',
      timestamp: new Date().toISOString(),
    }),
  );

  fastify.get(
    '/ready',
    {
      schema: {
        response: {
          200: readyResponseSchema,
          503: readyErrorResponseSchema,
        },
      },
    },
    async (_request, reply) => {
      const dbOk = await pingDatabase();
      if (!dbOk) {
        return reply.status(503).send({
          type: 'server_error',
          status: 'not_ready',
          database: 'disconnected',
        });
      }
      return { status: 'ready', database: 'connected', timestamp: new Date().toISOString() };
    },
  );
}
