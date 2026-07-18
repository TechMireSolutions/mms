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
import { registerStandardTenantRoutes, registerBulkPutRoute } from '../../lib/crudRouter.js';
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

  registerStandardTenantRoutes(fastify, {
    collection: COLLECTION,
    schema: attendanceRecordSchema,
    errorMessagePrefix: 'attendance',
    loadAllFn: loadAttendanceRecords,
    createFn: createAttendanceRecord,
    updateFn: updateAttendanceRecordById,
    deleteFn: deleteAttendanceRecordById,
    restoreFn: restoreAttendanceRecordById,
    nameSingular: 'record',
    namePlural: 'records',
    columnPreferencesObjectKey: ATTENDANCE_MODULE_CONTRACT.columnPreferencesObjectKey,
    computeMetricsFn: (records, request) => {
      const dateParam = (request.query as { date?: string }).date;
      const selectedDate =
        typeof dateParam === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateParam)
          ? dateParam
          : undefined;
      return computeAttendanceCommandMetrics(records, { selectedDate });
    },
  });

  // --- Bulk Replace ---
  registerBulkPutRoute(fastify, {
    collection: COLLECTION,
    schema: attendanceBulkSchema,
    saveFn: async (data) => replaceAttendanceRecords(data.records),
    responseKey: 'records',
    errorMessagePrefix: 'attendance records',
  });
}
