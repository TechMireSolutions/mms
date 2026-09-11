import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { getPoolMetrics, pingDatabase } from '../../db/database.js';
import { checkIsRedisConnected } from '../../lib/redis.js';

const poolSubMetricsSchema = z.object({
  totalCount: z.number(),
  idleCount: z.number(),
  waitingCount: z.number(),
});

const redisStatusSchema = z.object({
  connected: z.boolean(),
});

const healthResponseSchema = z.object({
  status: z.string(),
  timestamp: z.string(),
  pool: poolSubMetricsSchema
    .extend({
      replica: poolSubMetricsSchema.optional(),
    })
    .nullable()
    .optional(),
  redis: redisStatusSchema.optional(),
});

const readyResponseSchema = z.object({
  status: z.string(),
  database: z.string(),
  redis: z.string().optional(),
  timestamp: z.string(),
});

const readyErrorResponseSchema = z.object({
  type: z.string(),
  status: z.string(),
  database: z.string(),
  redis: z.string().optional(),
});

function safeGetPoolMetrics() {
  try {
    return typeof getPoolMetrics === 'function' ? getPoolMetrics() : null;
  } catch {
    return null;
  }
}

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
    async () => {
      const pool = safeGetPoolMetrics();
      const isDegraded = Boolean(
        pool && (pool.waitingCount > 5 || (pool.replica && pool.replica.waitingCount > 5)),
      );
      return {
        status: isDegraded ? 'DEGRADED' : 'OK',
        timestamp: new Date().toISOString(),
        pool,
        redis: {
          connected: checkIsRedisConnected(),
        },
      };
    },
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
      const isRedisRequired = Boolean(
        process.env.REDIS_URL && process.env.NODE_ENV !== 'test' && !process.env.VITEST,
      );
      const redisConnected = checkIsRedisConnected();
      const redisOk = !isRedisRequired || redisConnected;

      if (!dbOk || !redisOk) {
        return reply.status(503).send({
          type: 'server_error',
          status: 'not_ready',
          database: dbOk ? 'connected' : 'disconnected',
          redis: redisConnected ? 'connected' : 'disconnected',
        });
      }
      return {
        status: 'ready',
        database: 'connected',
        redis: redisConnected ? 'connected' : (isRedisRequired ? 'disconnected' : 'optional'),
        timestamp: new Date().toISOString(),
      };
    },
  );
}
