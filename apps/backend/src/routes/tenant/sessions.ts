import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { authenticateTenant } from '../../middleware/authenticate.js';
import { canDeleteCollection, canWriteCollection } from '../../services/rbacService.js';
import {
  createSession,
  deleteSessionById,
  restoreSessionById,
  bulkSoftDeleteSessions,
  bulkRestoreSessions,
  loadSessions,
  loadSessionsPage,
  updateSessionById,
} from '../../services/sessionService.js';
import type { User } from '@mms/shared';
import { computeSessionsCommandMetrics, SESSIONS_MODULE_MANIFEST } from '@mms/shared';
import { sendDatabaseError, sendForbidden } from '../../lib/httpErrors.js';
import { registerStandardTenantRoutes } from '../../lib/crudRouter.js';
import {
  sessionRecordSchema,
  sessionCreateBodySchema,
  sessionsListQuerySchema,
  sessionsBulkIdsSchema,
} from '../../validation/sessionSchemas.js';
import { parseRequest, replyValidationError } from '../../lib/zodRequest.js';

const COLLECTION = SESSIONS_MODULE_MANIFEST.collectionKey;

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
    listQuerySchema: sessionsListQuerySchema,
    defaultPageSize: SESSIONS_MODULE_MANIFEST.defaultPageSize,
    errorMessagePrefix: 'sessions',
    nameSingular: 'session',
    namePlural: 'sessions',
    loadPageFn: (query) => loadSessionsPage(query),
    loadAllFn: loadSessions,
    createFn: createSession,
    updateFn: updateSessionById,
    deleteFn: deleteSessionById,
    restoreFn: restoreSessionById,
    computeMetricsFn: (sessions) => computeSessionsCommandMetrics(sessions),
    columnPreferencesObjectKey: SESSIONS_MODULE_MANIFEST.columnPreferencesObjectKey,
    customPostRoute: true,
  });

  fastify.post('/', async (request, reply) => {
    const user = request.user as User;
    if (!canWriteCollection(user, COLLECTION)) return sendForbidden(reply);
    const parsed = parseRequest(sessionCreateBodySchema, request.body);
    if (!parsed.ok) return replyValidationError(reply, parsed.message);
    try {
      const item = await createSession(parsed.data as Parameters<typeof createSession>[0]);
      return reply.status(201).send({ session: item });
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : 'Failed to create session';
      return sendDatabaseError(reply, errMsg);
    }
  });

  fastify.post('/bulk-delete', async (request, reply) => {
    const user = request.user as User;
    if (!canDeleteCollection(user, COLLECTION)) return sendForbidden(reply);
    const parsed = parseRequest(sessionsBulkIdsSchema, request.body);
    if (!parsed.ok) return replyValidationError(reply, parsed.message);
    try {
      const result = await bulkSoftDeleteSessions(
        parsed.data.ids.map(String),
        String(user.id),
        parsed.data.deletionReason,
      );
      return reply.send({ success: true, ...result });
    } catch {
      return sendDatabaseError(reply, 'Failed to bulk delete sessions');
    }
  });

  fastify.post('/bulk-restore', async (request, reply) => {
    const user = request.user as User;
    if (!canDeleteCollection(user, COLLECTION)) return sendForbidden(reply);
    const parsed = parseRequest(sessionsBulkIdsSchema, request.body);
    if (!parsed.ok) return replyValidationError(reply, parsed.message);
    try {
      const result = await bulkRestoreSessions(parsed.data.ids.map(String));
      return reply.send({ success: true, ...result });
    } catch {
      return sendDatabaseError(reply, 'Failed to bulk restore sessions');
    }
  });
}
