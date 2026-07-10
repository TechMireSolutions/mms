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
import { resourceIdParamsSchema, softDeleteBodySchema } from '../../validation/commonSchemas.js';
import { registerColumnPreferencesRoutes } from '../../lib/columnPreferencesRouter.js';
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

  fastify.get('/metrics', async (request, reply) => {
    const user = request.user as User;
    if (!canReadCollection(user, COLLECTION)) return sendForbidden(reply);
    try {
      const sessions = await loadSessions();
      return reply.send({ metrics: computeSessionsCommandMetrics(sessions) });
    } catch {
      return reply.status(500).send({ type: 'database_error', message: 'Failed to load session metrics' });
    }
  });

  registerColumnPreferencesRoutes(fastify, {
    collection: COLLECTION,
    objectKey: SESSIONS_MODULE_CONTRACT.columnPreferencesObjectKey,
  });

  fastify.post('/', async (request, reply) => {
    const user = request.user as User;
    if (!canWriteCollection(user, COLLECTION)) return sendForbidden(reply);
    const parsed = parseRequest(sessionRecordSchema, request.body);
    if (!parsed.ok) return replyValidationError(reply, parsed.message);
    try {
      const session = await createSession(parsed.data);
      return reply.status(201).send({ session });
    } catch {
      return reply.status(500).send({ type: 'database_error', message: 'Failed to create session' });
    }
  });

  fastify.put('/:id', async (request, reply) => {
    const user = request.user as User;
    if (!canWriteCollection(user, COLLECTION)) return sendForbidden(reply);
    const params = parseRequest(resourceIdParamsSchema, request.params);
    const body = parseRequest(sessionRecordSchema, request.body);
    if (!params.ok) return replyValidationError(reply, params.message);
    if (!body.ok) return replyValidationError(reply, body.message);
    try {
      const updated = await updateSessionById(params.data.id, {
        ...body.data,
        id: body.data.id ?? params.data.id,
      });
      if (!updated) {
        return reply.status(404).send({ type: 'not_found', message: 'Session not found' });
      }
      return reply.send({ session: updated });
    } catch {
      return reply.status(500).send({ type: 'database_error', message: 'Failed to update session' });
    }
  });

  fastify.delete<{ Params: { id: string } }>('/:id', async (request, reply) => {
    const user = request.user as User;
    if (!canWriteCollection(user, COLLECTION)) return sendForbidden(reply);
    const params = parseRequest(resourceIdParamsSchema, request.params);
    if (!params.ok) return replyValidationError(reply, params.message);
    const body = parseRequest(softDeleteBodySchema, request.body ?? {});
    if (!body.ok) return replyValidationError(reply, body.message);
    try {
      const deleted = await deleteSessionById(params.data.id, String(user.id), body.data.deletionReason);
      if (!deleted) {
        return reply.status(404).send({ type: 'not_found', message: 'Session not found' });
      }
      return reply.send({ success: true });
    } catch {
      return reply.status(500).send({ type: 'database_error', message: 'Failed to delete session' });
    }
  });

  fastify.post('/:id/restore', async (request, reply) => {
    const user = request.user as User;
    if (!canWriteCollection(user, COLLECTION)) return sendForbidden(reply);
    const params = parseRequest(resourceIdParamsSchema, request.params);
    if (!params.ok) return replyValidationError(reply, params.message);
    try {
      const restored = await restoreSessionById(params.data.id);
      if (!restored) {
        return reply.status(404).send({ type: 'not_found', message: 'Session not found or not deleted' });
      }
      return reply.send({ success: true });
    } catch {
      return reply.status(500).send({ type: 'database_error', message: 'Failed to restore session' });
    }
  });
}
