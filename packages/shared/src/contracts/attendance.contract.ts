import { initContract } from '@ts-rest/core';
import { z } from 'zod';
import { baseListQuerySchema } from '../apiSchemas.js';
import { attendanceBulkIdsSchema } from '../schemas/attendance.dto.js';
import { attendanceRecordSchema, attendanceBulkSchema } from '../attendanceModuleManifest.js';
import { attendanceLookupsMapSchema } from '../attendanceLookupTypes.js';
import {
  attendanceReportAggregatesHttpQuerySchema,
  attendanceReportAggregatesSchema,
} from '../attendanceReportAggregates.js';

const c = initContract();
const errorResponse = z.unknown();

/** Normalized Attendance Setup preferences (`AttendanceModulePreferences`). */
export const attendancePreferencesResponseSchema = z.object({
  workingDays: z.array(z.string()),
  cutoffTime: z.string(),
  lateThresholdMins: z.number(),
  autoAbsentAfterMins: z.number(),
  qrEnabled: z.boolean(),
  lowAttendanceThreshold: z.number(),
  notifyParents: z.boolean(),
  requireNoteForAbsent: z.boolean(),
  lockAfterSubmit: z.boolean(),
  trackHalfDay: z.boolean(),
  weeklyReport: z.boolean(),
  attendanceAlerts: z.boolean(),
  allowManualOverride: z.boolean(),
  offlineEnabled: z.boolean(),
  geoTagging: z.boolean(),
  defaultViewLayout: z.string(),
});

/** Envelope for paginated attendance list responses (`AttendanceListPageResult`). */
export const attendanceListPageResponseSchema = z.object({
  records: z.array(attendanceRecordSchema),
  total: z.number(),
  page: z.number(),
  limit: z.number(),
  hasMore: z.boolean(),
});

const bulkResultResponseSchema = z.object({
  success: z.literal(true),
  succeeded: z.number(),
  failed: z.number(),
});

const widgetAggregateResultSchema = z.object({
  value: z.number(),
  totalCount: z.number(),
  chartData: z.array(z.object({ name: z.string(), value: z.number() })),
});

export const attendanceContract = c.router({
  list: {
    method: 'GET',
    path: '/api/attendance',
    query: baseListQuerySchema.extend({
      sessionId: z.string().max(100).optional(),
      classId: z.string().max(100).optional(),
      teacherId: z.string().max(100).optional(),
      date: z.string().max(30).optional(),
      dateFrom: z.string().max(30).optional(),
      dateTo: z.string().max(30).optional(),
      status: z.string().max(200).optional(),
    }),
    responses: {
      200: attendanceListPageResponseSchema,
    },
    summary: 'List attendance records',
  },
  create: {
    method: 'POST',
    path: '/api/attendance',
    body: z.unknown(),
    responses: {
      200: attendanceRecordSchema,
      201: attendanceRecordSchema,
    },
    summary: 'Create a new attendance record',
  },
  bulk: {
    method: 'PUT',
    path: '/api/attendance/bulk',
    body: attendanceBulkSchema,
    responses: {
      200: z.object({ records: z.array(attendanceRecordSchema) }),
      403: z.unknown(),
      500: z.unknown(),
    },
    summary: 'Bulk upsert attendance records',
  },
  bulkDelete: {
    method: 'POST',
    path: '/api/attendance/bulk-delete',
    body: attendanceBulkIdsSchema,
    responses: {
      200: bulkResultResponseSchema,
      403: z.unknown(),
      500: z.unknown(),
    },
    summary: 'Bulk soft-delete attendance records',
  },
  bulkRestore: {
    method: 'POST',
    path: '/api/attendance/bulk-restore',
    body: attendanceBulkIdsSchema,
    responses: {
      200: bulkResultResponseSchema,
      403: z.unknown(),
      500: z.unknown(),
    },
    summary: 'Bulk restore attendance records',
  },
  update: {
    method: 'PUT',
    path: '/api/attendance/:id',
    body: z.unknown(),
    responses: {
      200: z.object({ record: attendanceRecordSchema }),
      400: z.unknown(),
      403: z.unknown(),
      404: z.unknown(),
      500: z.unknown(),
    },
    summary: 'Update an attendance record by ID',
  },
  delete: {
    method: 'DELETE',
    path: '/api/attendance/:id',
    body: z.unknown(),
    responses: {
      200: z.object({ success: z.literal(true) }),
      400: z.unknown(),
      403: z.unknown(),
      404: z.unknown(),
      500: z.unknown(),
    },
    summary: 'Soft delete an attendance record by ID',
  },
  restore: {
    method: 'POST',
    path: '/api/attendance/:id/restore',
    body: z.unknown(),
    responses: {
      200: z.object({ success: z.literal(true) }),
      400: z.unknown(),
      403: z.unknown(),
      404: z.unknown(),
      500: z.unknown(),
    },
    summary: 'Restore a soft-deleted attendance record by ID',
  },
  widgetAggregates: {
    method: 'POST',
    path: '/api/attendance/widget-aggregates',
    body: z.object({ widgets: z.array(z.unknown()) }),
    responses: {
      200: z.record(z.string(), widgetAggregateResultSchema),
      403: errorResponse,
      500: errorResponse,
    },
    summary: 'Get widget aggregates',
  },
  reportAggregates: {
    method: 'GET',
    path: '/api/attendance/report-aggregates',
    query: attendanceReportAggregatesHttpQuerySchema,
    responses: {
      200: attendanceReportAggregatesSchema,
      403: errorResponse,
      500: errorResponse,
    },
    summary: 'Get attendance report aggregates',
  },

  getFieldConfig: {
    method: 'GET',
    path: '/api/attendance/field-config',
    responses: { 200: z.object({ config: z.record(z.string(), z.unknown()).nullable() }), 403: errorResponse, 500: errorResponse },
    summary: 'Get field config',
  },
  updateFieldConfig: {
    method: 'PUT',
    path: '/api/attendance/field-config',
    body: z.unknown(),
    responses: { 200: z.object({ success: z.literal(true), config: z.record(z.string(), z.unknown()) }), 403: errorResponse, 500: errorResponse },
    summary: 'Update field config',
  },
  getPreferences: {
    method: 'GET',
    path: '/api/attendance/preferences',
    responses: { 200: z.object({ preferences: attendancePreferencesResponseSchema }), 403: errorResponse, 500: errorResponse },
    summary: 'Get preferences',
  },
  updatePreferences: {
    method: 'PUT',
    path: '/api/attendance/preferences',
    body: z.unknown(),
    responses: { 200: z.object({ success: z.literal(true), preferences: attendancePreferencesResponseSchema }), 403: errorResponse, 500: errorResponse },
    summary: 'Update preferences',
  },
  getLookups: {
    method: 'GET',
    path: '/api/attendance/lookups',
    responses: { 200: z.object({ lookups: attendanceLookupsMapSchema }), 403: errorResponse, 500: errorResponse },
    summary: 'Get all lookups',
  },
  getLookupKind: {
    method: 'GET',
    path: '/api/attendance/lookups/:kind',
    responses: { 200: z.unknown(), 403: errorResponse, 500: errorResponse },
    summary: 'Get a specific lookup kind',
  },
});
