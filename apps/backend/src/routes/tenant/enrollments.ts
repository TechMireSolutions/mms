import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { authenticateTenant } from '../../middleware/authenticate.js';
import { ENROLLMENTS_MODULE_CONTRACT, computeEnrollmentsCommandMetrics } from '@mms/shared';
import { registerColumnPreferencesRoutes } from '../../lib/columnPreferencesRouter.js';
import { registerResourceRoutes, registerMetricsRoute } from '../../lib/crudRouter.js';
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

  // --- Metrics ---
  registerMetricsRoute(fastify, {
    collection: ENROLLMENTS_COLLECTION,
    loadMetricsFn: async () => {
      const enrollments = await loadEnrollments();
      return computeEnrollmentsCommandMetrics(
        enrollments as Array<{ status?: string; finalFee?: number; enrolledDate?: string }>,
      );
    },
    errorMessagePrefix: 'enrollment',
  });

  // --- Resource CRUD ---
  registerResourceRoutes(fastify, {
    collection: ENROLLMENTS_COLLECTION,
    schema: enrollmentRecordSchema,
    loadAllFn: loadEnrollments,
    createFn: createEnrollment,
    updateFn: updateEnrollmentById,
    deleteFn: deleteEnrollmentById,
    restoreFn: restoreEnrollmentById,
    nameSingular: 'enrollment',
    namePlural: 'enrollments',
  });

  registerColumnPreferencesRoutes(fastify, {
    collection: ENROLLMENTS_COLLECTION,
    objectKey: ENROLLMENTS_MODULE_CONTRACT.columnPreferencesObjectKey,
  });
}
