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
import { sendForbidden } from '../lib/httpErrors.js';
import { resourceIdParamsSchema } from '../validation/commonSchemas.js';
import { sessionRecordSchema } from '../validation/sessionSchemas.js';
import { parseRequest, replyValidationError } from '../lib/zodRequest.js';

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
