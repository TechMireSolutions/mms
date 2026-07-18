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
import { registerStandardTenantRoutes } from '../../lib/crudRouter.js';
import { sessionRecordSchema } from '../../validation/sessionSchemas.js';

const COLLECTION = SESSIONS_MODULE_CONTRACT.collectionKey;

/**
 * Server-first sessions resource routes (TanStack Query on FE).
 */
export default async function sessionsRoutes(
  fastify: FastifyInstance,
  _options: FastifyPluginOptions,
): Promise<void> {
  fastify.addHook('preHandler', authenticateTenant);

  registerStandardTenantRoutes(fastify, {
    collection: COLLECTION,
    schema: sessionRecordSchema,
    errorMessagePrefix: 'sessions',
    nameSingular: 'session',
    namePlural: 'sessions',
    loadAllFn: loadSessions,
    createFn: createSession,
    updateFn: updateSessionById,
    deleteFn: deleteSessionById,
    restoreFn: restoreSessionById,
    computeMetricsFn: (sessions) => computeSessionsCommandMetrics(sessions),
    columnPreferencesObjectKey: SESSIONS_MODULE_CONTRACT.columnPreferencesObjectKey,
  });
}
