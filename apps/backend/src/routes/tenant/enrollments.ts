import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { authenticateTenant } from '../../middleware/authenticate.js';
import { canReadCollection, canWriteCollection } from '../../services/rbacService.js';
import type { User } from '@mms/shared';
import { ENROLLMENTS_MODULE_CONTRACT } from '@mms/shared';
import { sendForbidden } from '../../lib/httpErrors.js';
import { moduleColumnPreferencesBodySchema } from '../../validation/moduleColumnPreferencesSchemas.js';
import { parseRequest, replyValidationError } from '../../lib/zodRequest.js';
import { resourceIdParamsSchema } from '../../validation/commonSchemas.js';
import {
  getUserColumnPreferencesForModule,
  setUserColumnPreferencesForModule,
} from '../../services/userColumnPreferencesService.js';
import { loadEnrollmentsCommandMetrics } from '../../services/enrollmentsMetricsService.js';
import {
  loadEnrollments,
  createEnrollment,
  updateEnrollmentById,
  deleteEnrollmentById,
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
  fastify.delete('/:id', async (request, reply) => {
    const user = request.user as User;
    if (!canWriteCollection(user, ENROLLMENTS_COLLECTION)) return sendForbidden(reply);
    const params = parseRequest(resourceIdParamsSchema, request.params);
    if (!params.ok) return replyValidationError(reply, params.message);
    try {
      const deleted = await deleteEnrollmentById(params.data.id);
      if (!deleted) {
        return reply.status(404).send({ type: 'not_found', message: 'Enrollment not found' });
      }
      return reply.send({ success: true });
    } catch {
      return reply.status(500).send({ type: 'database_error', message: 'Failed to delete enrollment' });
    }
  });

  // --- Column Preferences ---
  fastify.get('/column-preferences', async (request, reply) => {
    const user = request.user as User;
    if (!canReadCollection(user, ENROLLMENTS_COLLECTION)) return sendForbidden(reply);
    try {
      const preferences = await getUserColumnPreferencesForModule(
        ENROLLMENTS_MODULE_CONTRACT.columnPreferencesObjectKey,
        String(user.id),
      );
      return reply.send({ preferences });
    } catch {
      return reply.status(500).send({ type: 'database_error', message: 'Failed to load column preferences' });
    }
  });

  fastify.put('/column-preferences', async (request, reply) => {
    const user = request.user as User;
    if (!canReadCollection(user, ENROLLMENTS_COLLECTION)) return sendForbidden(reply);
    const parsed = parseRequest(moduleColumnPreferencesBodySchema, request.body);
    if (!parsed.ok) return replyValidationError(reply, parsed.message);
    try {
      await setUserColumnPreferencesForModule(
        ENROLLMENTS_MODULE_CONTRACT.columnPreferencesObjectKey,
        String(user.id),
        parsed.data.preferences,
      );
      return reply.send({ success: true, preferences: parsed.data.preferences });
    } catch {
      return reply.status(500).send({ type: 'database_error', message: 'Failed to save column preferences' });
    }
  });
}
