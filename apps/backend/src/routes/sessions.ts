import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { authenticateTenant } from '../middleware/authenticate.js';
import { canReadCollection, canWriteCollection } from '../services/rbacService.js';
import {
  createSession,
  deleteSessionById,
  loadSessions,
  updateSessionById,
} from '../services/sessionService.js';
import type { User } from '@mms/shared';
import { computeSessionsCommandMetrics, SESSIONS_MODULE_CONTRACT } from '@mms/shared';
import { sendForbidden } from '../lib/httpErrors.js';
import { resourceIdParamsSchema } from '../validation/commonSchemas.js';
import { moduleColumnPreferencesBodySchema } from '../validation/moduleColumnPreferencesSchemas.js';
import { sessionRecordSchema } from '../validation/sessionSchemas.js';
import { parseRequest, replyValidationError } from '../lib/zodRequest.js';
import {
  getUserColumnPreferencesForModule,
  setUserColumnPreferencesForModule,
} from '../services/userColumnPreferencesService.js';

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
    try {
      return reply.send({ sessions: await loadSessions() });
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

  fastify.get('/column-preferences', async (request, reply) => {
    const user = request.user as User;
    if (!canReadCollection(user, COLLECTION)) return sendForbidden(reply);
    try {
      const preferences = await getUserColumnPreferencesForModule(
        SESSIONS_MODULE_CONTRACT.columnPreferencesObjectKey,
        String(user.id),
      );
      return reply.send({ preferences });
    } catch {
      return reply.status(500).send({ type: 'database_error', message: 'Failed to load column preferences' });
    }
  });

  fastify.put('/column-preferences', async (request, reply) => {
    const user = request.user as User;
    if (!canReadCollection(user, COLLECTION)) return sendForbidden(reply);
    const parsed = parseRequest(moduleColumnPreferencesBodySchema, request.body);
    if (!parsed.ok) return replyValidationError(reply, parsed.message);
    try {
      await setUserColumnPreferencesForModule(
        SESSIONS_MODULE_CONTRACT.columnPreferencesObjectKey,
        String(user.id),
        parsed.data.preferences,
      );
      return reply.send({ success: true, preferences: parsed.data.preferences });
    } catch {
      return reply.status(500).send({ type: 'database_error', message: 'Failed to save column preferences' });
    }
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
    try {
      const deleted = await deleteSessionById(params.data.id);
      if (!deleted) {
        return reply.status(404).send({ type: 'not_found', message: 'Session not found' });
      }
      return reply.send({ success: true });
    } catch {
      return reply.status(500).send({ type: 'database_error', message: 'Failed to delete session' });
    }
  });
}
