import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { authenticateTenant } from '../../middleware/authenticate.js';
import { canDeleteCollection } from '../../services/rbacService.js';
import { ENROLLMENTS_MODULE_CONTRACT, computeEnrollmentsCommandMetrics, type User } from '@mms/shared';
import { registerStandardTenantRoutes } from '../../lib/crudRouter.js';
import {
  enrollmentRecordSchema,
  enrollmentsListQuerySchema,
  enrollmentsBulkIdsSchema,
} from '../../validation/enrollmentSchemas.js';
import { sendDatabaseError, sendForbidden } from '../../lib/httpErrors.js';
import { parseRequest, replyValidationError } from '../../lib/zodRequest.js';

import {
  loadEnrollments,
  loadEnrollmentsPage,
  createEnrollment,
  updateEnrollmentById,
  deleteEnrollmentById,
  restoreEnrollmentById,
  bulkSoftDeleteEnrollments,
  bulkRestoreEnrollments,
} from '../../services/enrollmentService.js';

const ENROLLMENTS_COLLECTION = ENROLLMENTS_MODULE_CONTRACT.collectionKey;

/**
 * Enrollments module routes — CRUD, metrics, soft-delete, and column preferences.
 */
export default async function enrollmentsRoutes(
  fastify: FastifyInstance,
  _options: FastifyPluginOptions,
): Promise<void> {
  fastify.addHook('preHandler', authenticateTenant);

  registerStandardTenantRoutes(fastify, {
    collection: ENROLLMENTS_COLLECTION,
    schema: enrollmentRecordSchema,
    listQuerySchema: enrollmentsListQuerySchema,
    defaultPageSize: ENROLLMENTS_MODULE_CONTRACT.defaultPageSize,
    errorMessagePrefix: 'enrollments',
    nameSingular: 'enrollment',
    namePlural: 'enrollments',
    loadPageFn: (query) => loadEnrollmentsPage(query),
    loadAllFn: loadEnrollments,
    createFn: createEnrollment,
    updateFn: updateEnrollmentById,
    deleteFn: deleteEnrollmentById,
    restoreFn: restoreEnrollmentById,
    computeMetricsFn: (records) => computeEnrollmentsCommandMetrics(records),
    columnPreferencesObjectKey: ENROLLMENTS_MODULE_CONTRACT.columnPreferencesObjectKey,
  });

  fastify.post('/bulk-delete', async (request, reply) => {
    const user = request.user as User;
    if (!canDeleteCollection(user, ENROLLMENTS_COLLECTION)) return sendForbidden(reply);
    const parsed = parseRequest(enrollmentsBulkIdsSchema, request.body);
    if (!parsed.ok) return replyValidationError(reply, parsed.message);
    try {
      const result = await bulkSoftDeleteEnrollments(
        parsed.data.ids.map(String),
        String(user.id),
        parsed.data.deletionReason,
      );
      return reply.send({ success: true, ...result });
    } catch {
      return sendDatabaseError(reply, 'Failed to bulk delete enrollments');
    }
  });

  fastify.post('/bulk-restore', async (request, reply) => {
    const user = request.user as User;
    if (!canDeleteCollection(user, ENROLLMENTS_COLLECTION)) return sendForbidden(reply);
    const parsed = parseRequest(enrollmentsBulkIdsSchema, request.body);
    if (!parsed.ok) return replyValidationError(reply, parsed.message);
    try {
      const result = await bulkRestoreEnrollments(parsed.data.ids.map(String));
      return reply.send({ success: true, ...result });
    } catch {
      return sendDatabaseError(reply, 'Failed to bulk restore enrollments');
    }
  });
}
