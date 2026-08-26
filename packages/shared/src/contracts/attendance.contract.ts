import { initContract } from '@ts-rest/core';
import { z } from 'zod';
import { baseListQuerySchema } from '../apiSchemas.js';
import { attendanceBulkIdsSchema } from '../schemas/attendance.dto.js';
import { attendanceBulkSchema } from '../attendanceModuleManifest.js';

const c = initContract();
const errorResponse = z.unknown();

export const attendanceContract = c.router({
  list: {
    method: 'GET',
    path: '/api/attendance',
    query: baseListQuerySchema,
    responses: {
      200: z.unknown(),
    },
    summary: 'List attendance records',
  },
  create: {
    method: 'POST',
    path: '/api/attendance',
    body: z.unknown(),
    responses: {
      200: z.unknown(),
      201: z.unknown(),
    },
    summary: 'Create a new attendance record',
  },
  bulk: {
    method: 'PUT',
    path: '/api/attendance/bulk',
    body: attendanceBulkSchema,
    responses: {
      200: z.unknown(),
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
      200: z.unknown(),
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
      200: z.unknown(),
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
      200: z.unknown(),
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
      200: z.unknown(),
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
      200: z.unknown(),
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
    responses: { 200: z.unknown(), 403: errorResponse, 500: errorResponse },
    summary: 'Get widget aggregates',
  },

  getFieldConfig: {
    method: 'GET',
    path: '/api/attendance/field-config',
    responses: { 200: z.unknown(), 403: errorResponse, 500: errorResponse },
    summary: 'Get field config',
  },
  updateFieldConfig: {
    method: 'PUT',
    path: '/api/attendance/field-config',
    body: z.unknown(),
    responses: { 200: z.unknown(), 403: errorResponse, 500: errorResponse },
    summary: 'Update field config',
  },
  getPreferences: {
    method: 'GET',
    path: '/api/attendance/preferences',
    responses: { 200: z.unknown(), 403: errorResponse, 500: errorResponse },
    summary: 'Get preferences',
  },
  updatePreferences: {
    method: 'PUT',
    path: '/api/attendance/preferences',
    body: z.unknown(),
    responses: { 200: z.unknown(), 403: errorResponse, 500: errorResponse },
    summary: 'Update preferences',
  },
  getLookups: {
    method: 'GET',
    path: '/api/attendance/lookups',
    responses: { 200: z.unknown(), 403: errorResponse, 500: errorResponse },
    summary: 'Get all lookups',
  },
  getLookupKind: {
    method: 'GET',
    path: '/api/attendance/lookups/:kind',
    responses: { 200: z.unknown(), 403: errorResponse, 500: errorResponse },
    summary: 'Get a specific lookup kind',
  },
});
