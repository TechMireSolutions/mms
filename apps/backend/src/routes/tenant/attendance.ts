import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { authenticateTenant } from '../../middleware/authenticate.js';
import { canDeleteCollection } from '../../services/rbacService.js';

import {
  createAttendanceRecord,
  deleteAttendanceRecordById,
  restoreAttendanceRecordById,
  bulkSoftDeleteAttendance,
  bulkRestoreAttendance,
  loadAttendanceRecords,
  loadAttendancePage,
  upsertAttendanceRecords,
  updateAttendanceRecordById,
} from '../../services/attendanceService.js';
import { computeAttendanceCommandMetrics, ATTENDANCE_MODULE_MANIFEST, type User } from '@mms/shared';
import { registerStandardTenantRoutes, registerBulkPutRoute } from '../../lib/crudRouter.js';
import {
  attendanceBulkSchema,
  attendanceRecordSchema,
} from '@mms/shared';
import {
  attendanceBulkIdsSchema,
  attendanceListQuerySchema,
} from '../../validation/attendanceSchemas.js';
import { parseRequest, replyValidationError } from '../../lib/zodRequest.js';
import { sendDatabaseError, sendForbidden } from '../../lib/httpErrors.js';
import { attendanceReportRoutes } from './attendance/attendanceReportRoutes.js';
import { attendanceSetupConfigRoutes } from './attendanceSetupConfigRoutes.js';
import { attendanceLookupRoutes } from './attendance/attendanceLookupRoutes.js';

const COLLECTION = ATTENDANCE_MODULE_MANIFEST.collectionKey;

/**
 * Server-first attendance resource routes (TanStack Query on FE).
 */
export default async function attendanceRoutes(
  fastify: FastifyInstance,
  _options: FastifyPluginOptions,
): Promise<void> {
  fastify.addHook('preHandler', authenticateTenant);

  await fastify.register(attendanceReportRoutes);
  await fastify.register(attendanceSetupConfigRoutes);
  await fastify.register(attendanceLookupRoutes);

  registerStandardTenantRoutes(fastify, {
    collection: COLLECTION,
    schema: attendanceRecordSchema,
    listQuerySchema: attendanceListQuerySchema,
    defaultPageSize: ATTENDANCE_MODULE_MANIFEST.defaultPageSize,
    errorMessagePrefix: 'attendance',
    loadPageFn: loadAttendancePage,
    canWriteDeletedCheck: (user) => canDeleteCollection(user, COLLECTION),
    loadAllFn: loadAttendanceRecords,
    createFn: createAttendanceRecord,
    updateFn: updateAttendanceRecordById,
    deleteFn: deleteAttendanceRecordById,
    restoreFn: restoreAttendanceRecordById,
    nameSingular: 'record',
    namePlural: 'records',
    columnPreferencesObjectKey: ATTENDANCE_MODULE_MANIFEST.columnPreferencesObjectKey,
    computeMetricsFn: (records, request) => {
      const dateParam = (request.query as { date?: string }).date;
      const selectedDate =
        typeof dateParam === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateParam)
          ? dateParam
          : undefined;
      return computeAttendanceCommandMetrics(records, { selectedDate });
    },
  });

  registerBulkPutRoute(fastify, {
    collection: COLLECTION,
    schema: attendanceBulkSchema,
    saveFn: async (data) => upsertAttendanceRecords(data.records),
    responseKey: 'records',
    errorMessagePrefix: 'attendance records',
  });

  fastify.post('/bulk-delete', async (request, reply) => {
    const user = request.user as User;
    if (!canDeleteCollection(user, COLLECTION)) return sendForbidden(reply);
    const parsed = parseRequest(attendanceBulkIdsSchema, request.body);
    if (!parsed.ok) return replyValidationError(reply, parsed.message);
    try {
      const result = await bulkSoftDeleteAttendance(
        parsed.data.ids.map(String),
        String(user.id),
        parsed.data.deletionReason,
      );
      return reply.send({ success: true, ...result });
    } catch {
      return sendDatabaseError(reply, 'Failed to bulk delete attendance records');
    }
  });

  fastify.post('/bulk-restore', async (request, reply) => {
    const user = request.user as User;
    if (!canDeleteCollection(user, COLLECTION)) return sendForbidden(reply);
    const parsed = parseRequest(attendanceBulkIdsSchema, request.body);
    if (!parsed.ok) return replyValidationError(reply, parsed.message);
    try {
      const result = await bulkRestoreAttendance(parsed.data.ids.map(String));
      return reply.send({ success: true, ...result });
    } catch {
      return sendDatabaseError(reply, 'Failed to bulk restore attendance records');
    }
  });
}
