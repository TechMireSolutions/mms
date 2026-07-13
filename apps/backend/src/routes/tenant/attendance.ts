import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { authenticateTenant } from '../../middleware/authenticate.js';

import {
  createAttendanceRecord,
  deleteAttendanceRecordById,
  restoreAttendanceRecordById,
  loadAttendanceRecords,
  replaceAttendanceRecords,
  updateAttendanceRecordById,
} from '../../services/attendanceService.js';
import { computeAttendanceCommandMetrics, ATTENDANCE_MODULE_CONTRACT } from '@mms/shared';
import { registerColumnPreferencesRoutes } from '../../lib/columnPreferencesRouter.js';
import { registerResourceRoutes, registerMetricsRoute, registerBulkPutRoute } from '../../lib/crudRouter.js';
import {
  attendanceBulkSchema,
  attendanceRecordSchema,
} from '@mms/shared';


const COLLECTION = 'attendance_records';

/**
 * Server-first attendance resource routes (TanStack Query on FE).
 */
export default async function attendanceRoutes(
  fastify: FastifyInstance,
  _options: FastifyPluginOptions,
): Promise<void> {
  fastify.addHook('preHandler', authenticateTenant);

  // --- Metrics ---
  registerMetricsRoute(fastify, {
    collection: COLLECTION,
    loadMetricsFn: async (request) => {
      const dateParam = (request.query as { date?: string }).date;
      const selectedDate =
        typeof dateParam === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateParam)
          ? dateParam
          : undefined;
      const records = await loadAttendanceRecords();
      return computeAttendanceCommandMetrics(records, { selectedDate });
    },
    errorMessagePrefix: 'attendance',
  });


  registerColumnPreferencesRoutes(fastify, {
    collection: COLLECTION,
    objectKey: ATTENDANCE_MODULE_CONTRACT.columnPreferencesObjectKey,
  });

  // --- Bulk Replace ---
  registerBulkPutRoute(fastify, {
    collection: COLLECTION,
    schema: attendanceBulkSchema,
    saveFn: async (data) => replaceAttendanceRecords(data.records),
    responseKey: 'records',
    errorMessagePrefix: 'attendance records',
  });

  // --- Resource CRUD ---
  registerResourceRoutes(fastify, {
    collection: COLLECTION,
    schema: attendanceRecordSchema,
    loadAllFn: loadAttendanceRecords,
    createFn: createAttendanceRecord,
    updateFn: updateAttendanceRecordById,
    deleteFn: deleteAttendanceRecordById,
    restoreFn: restoreAttendanceRecordById,
    nameSingular: 'record',
    namePlural: 'records',
  });
}
