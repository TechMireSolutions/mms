import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { authenticateTenant } from '../../middleware/authenticate.js';
import { canReadCollection, canWriteCollection } from '../../services/rbacService.js';
import type { User } from '@mms/shared';
import { ENROLLMENTS_MODULE_CONTRACT } from '@mms/shared';
import { sendForbidden } from '../../lib/httpErrors.js';
import { registerColumnPreferencesRoutes } from '../../lib/columnPreferencesRouter.js';
import { parseRequest, replyValidationError } from '../../lib/zodRequest.js';
import { resourceIdParamsSchema, softDeleteBodySchema } from '../../validation/commonSchemas.js';

import { loadEnrollmentsCommandMetrics } from '../../services/enrollmentsMetricsService.js';
import {
  loadEnrollments,
  createEnrollment,
  updateEnrollmentById,
  deleteEnrollmentById,
  restoreEnrollmentById,
} from '../../services/enrollmentService.js';
import { enrollmentRecordSchema } from '../../validation/enrollmentSchemas.js';

const ENROLLMENTS_COLLECTION = ENROLLMENTS_MODULE_CONTRACT.collectionKey;

/**
 * Enrollments module routes — CRUD, metrics, and column preferences.
 */
export default async function enrollmentsRoutes(
  fastify: FastifyInstance,
  _options: FastifyPluginOptions,
): Promise<void> {
  fastify.addHook('preHandler', authenticateTenant);

  // --- List & Read ---
  fastify.get('/', async (request, reply) => {
    const user = request.user as User;
    if (!canReadCollection(user, ENROLLMENTS_COLLECTION)) return sendForbidden(reply);
    try {
      return reply.send({ enrollments: await loadEnrollments() });
    } catch {
      return reply.status(500).send({ type: 'database_error', message: 'Failed to list enrollments' });
    }
  });

  // --- Metrics ---
  fastify.get('/metrics', async (request, reply) => {
    const user = request.user as User;
    if (!canReadCollection(user, ENROLLMENTS_COLLECTION)) return sendForbidden(reply);
    try {
      return reply.send({ metrics: await loadEnrollmentsCommandMetrics() });
    } catch {
      return reply.status(500).send({ type: 'database_error', message: 'Failed to load enrollment metrics' });
    }
  });

  // --- Create ---
  fastify.post('/', async (request, reply) => {
    const user = request.user as User;
    if (!canWriteCollection(user, ENROLLMENTS_COLLECTION)) return sendForbidden(reply);
    const parsed = parseRequest(enrollmentRecordSchema, request.body);
    if (!parsed.ok) return replyValidationError(reply, parsed.message);
    try {
      const enrollment = await createEnrollment(parsed.data);
      return reply.status(201).send({ enrollment });
    } catch {
      return reply.status(500).send({ type: 'database_error', message: 'Failed to create enrollment' });
    }
  });

  // --- Update ---
  fastify.put('/:id', async (request, reply) => {
    const user = request.user as User;
    if (!canWriteCollection(user, ENROLLMENTS_COLLECTION)) return sendForbidden(reply);
    const params = parseRequest(resourceIdParamsSchema, request.params);
    const body = parseRequest(enrollmentRecordSchema, request.body);
    if (!params.ok) return replyValidationError(reply, params.message);
    if (!body.ok) return replyValidationError(reply, body.message);
    try {
      const updated = await updateEnrollmentById(params.data.id, {
        ...body.data,
        id: body.data.id ?? params.data.id,
      });
      if (!updated) {
        return reply.status(404).send({ type: 'not_found', message: 'Enrollment not found' });
      }
      return reply.send({ enrollment: updated });
    } catch {
      return reply.status(500).send({ type: 'database_error', message: 'Failed to update enrollment' });
    }
  });

  // --- Delete ---
  fastify.delete<{ Params: { id: string } }>('/:id', async (request, reply) => {
    const user = request.user as User;
    if (!canWriteCollection(user, ENROLLMENTS_COLLECTION)) return sendForbidden(reply);
    const params = parseRequest(resourceIdParamsSchema, request.params);
    if (!params.ok) return replyValidationError(reply, params.message);
    const body = parseRequest(softDeleteBodySchema, request.body ?? {});
    if (!body.ok) return replyValidationError(reply, body.message);
    try {
      const deleted = await deleteEnrollmentById(params.data.id, String(user.id), body.data.deletionReason);
      if (!deleted) {
        return reply.status(404).send({ type: 'not_found', message: 'Enrollment not found' });
      }
      return reply.send({ success: true });
    } catch {
      return reply.status(500).send({ type: 'database_error', message: 'Failed to delete enrollment' });
    }
  });

  // --- Restore ---
  fastify.post('/:id/restore', async (request, reply) => {
    const user = request.user as User;
    if (!canWriteCollection(user, ENROLLMENTS_COLLECTION)) return sendForbidden(reply);
    const params = parseRequest(resourceIdParamsSchema, request.params);
    if (!params.ok) return replyValidationError(reply, params.message);
    try {
      const restored = await restoreEnrollmentById(params.data.id);
      if (!restored) {
        return reply.status(404).send({ type: 'not_found', message: 'Enrollment not found or not deleted' });
      }
      return reply.send({ success: true });
    } catch {
      return reply.status(500).send({ type: 'database_error', message: 'Failed to restore enrollment' });
    }
  });

  registerColumnPreferencesRoutes(fastify, {
    collection: ENROLLMENTS_COLLECTION,
    objectKey: ENROLLMENTS_MODULE_CONTRACT.columnPreferencesObjectKey,
  });
}
