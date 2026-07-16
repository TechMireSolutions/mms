import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { authenticateTenant } from '../../middleware/authenticate.js';
import {
  createSession,
  deleteSessionById,
  restoreSessionById,
  loadSessions,
  updateSessionById,
} from '../../services/sessionService.js';
import { computeSessionsCommandMetrics, SESSIONS_MODULE_CONTRACT } from '@mms/shared';
import { registerColumnPreferencesRoutes } from '../../lib/columnPreferencesRouter.js';
import {
  registerResourceRoutes,
  registerMetricsRoute,
  registerPaginatedListRoute,
} from '../../lib/crudRouter.js';
import { sessionRecordSchema, sessionsListQuerySchema } from '../../validation/sessionSchemas.js';

const COLLECTION = 'sessions';

/**
 * Server-first sessions resource routes (TanStack Query on FE).
 */
export default async function sessionsRoutes(
  fastify: FastifyInstance,
  _options: FastifyPluginOptions,
): Promise<void> {
  fastify.addHook('preHandler', authenticateTenant);

  // --- GET List (Paginated) ---
  registerPaginatedListRoute(fastify, {
    collection: COLLECTION,
    schema: sessionsListQuerySchema,
    defaultPageSize: SESSIONS_MODULE_CONTRACT.defaultPageSize,
    errorMessagePrefix: 'sessions',
    loadPageFn: async () => ([] as any),
    loadAllFn: (options) => loadSessions(options),
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
