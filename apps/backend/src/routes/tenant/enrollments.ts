import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { authenticateTenant } from '../../middleware/authenticate.js';
import { ENROLLMENTS_MODULE_CONTRACT, computeEnrollmentsCommandMetrics } from '@mms/shared';
import { registerStandardTenantRoutes } from '../../lib/crudRouter.js';
import { enrollmentRecordSchema } from '../../validation/enrollmentSchemas.js';

import {
  loadEnrollments,
  createEnrollment,
  updateEnrollmentById,
  deleteEnrollmentById,
  restoreEnrollmentById,
} from '../../services/enrollmentService.js';

const ENROLLMENTS_COLLECTION = ENROLLMENTS_MODULE_CONTRACT.collectionKey;

/**
 * Enrollments module routes — CRUD, metrics, and column preferences.
 */
export default async function enrollmentsRoutes(
  fastify: FastifyInstance,
  _options: FastifyPluginOptions,
): Promise<void> {
  fastify.addHook('preHandler', authenticateTenant);

  registerStandardTenantRoutes(fastify, {
    collection: ENROLLMENTS_COLLECTION,
    schema: enrollmentRecordSchema,
    errorMessagePrefix: 'enrollments',
    nameSingular: 'enrollment',
    namePlural: 'enrollments',
    loadAllFn: loadEnrollments,
    createFn: createEnrollment,
    updateFn: updateEnrollmentById,
    deleteFn: deleteEnrollmentById,
    restoreFn: restoreEnrollmentById,
    computeMetricsFn: (records) => computeEnrollmentsCommandMetrics(records),
    columnPreferencesObjectKey: ENROLLMENTS_MODULE_CONTRACT.columnPreferencesObjectKey,
  });
}
