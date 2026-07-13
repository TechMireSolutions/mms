import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { authenticateTenant } from '../../middleware/authenticate.js';
import { canReadCollection, canWriteCollection } from '../../services/rbacService.js';
import {
  createSession,
  deleteSessionById,
  restoreSessionById,
  loadSessions,
  updateSessionById,
} from '../../services/sessionService.js';
import type { User } from '@mms/shared';
import { computeSessionsCommandMetrics, SESSIONS_MODULE_CONTRACT } from '@mms/shared';
import { sendForbidden } from '../../lib/httpErrors.js';
import { registerColumnPreferencesRoutes } from '../../lib/columnPreferencesRouter.js';
import { registerResourceRoutes, registerMetricsRoute } from '../../lib/crudRouter.js';
import { sessionRecordSchema, sessionsListQuerySchema } from '../../validation/sessionSchemas.js';
import { parseRequest, replyValidationError } from '../../lib/zodRequest.js';

const COLLECTION = 'sessions';

/**
 * Server-first sessions resource routes (TanStack Query on FE).
 */
export default async function sessionsRoutes(
  fastify: FastifyInstance,
  _options: FastifyPluginOptions,
): Promise<void> {
  fastify.addHook('preHandler', authenticateTenant);

  // --- Custom GET ---
  fastify.get('/', async (request, reply) => {
    const user = request.user as User;
    if (!canReadCollection(user, COLLECTION)) return sendForbidden(reply);
    const queryParsed = parseRequest(sessionsListQuerySchema, request.query);
    if (!queryParsed.ok) return replyValidationError(reply, queryParsed.message);
    try {
      const query = queryParsed.data;
      const includeDeleted = query.includeDeleted === 'true';
      if (includeDeleted && !canWriteCollection(user, COLLECTION)) {
        return sendForbidden(reply);
      }
      return reply.send({ sessions: await loadSessions({ includeDeleted }) });
    } catch {
      return reply.status(500).send({ type: 'database_error', message: 'Failed to list sessions' });
    }
  });

  // --- Metrics ---
  registerMetricsRoute(fastify, {
    collection: COLLECTION,
    loadMetricsFn: async () => {
      const sessions = await loadSessions();
      return computeSessionsCommandMetrics(sessions);
    },
    errorMessagePrefix: 'session',
  });

  registerColumnPreferencesRoutes(fastify, {
    collection: COLLECTION,
    objectKey: SESSIONS_MODULE_CONTRACT.columnPreferencesObjectKey,
  });

  // --- Resource CRUD ---
  registerResourceRoutes(fastify, {
    customGetRoute: true,
    collection: COLLECTION,
    schema: sessionRecordSchema,
    loadAllFn: loadSessions,
    createFn: createSession,
    updateFn: updateSessionById,
    deleteFn: deleteSessionById,
    restoreFn: restoreSessionById,
    nameSingular: 'session',
    namePlural: 'sessions',
  });
}
