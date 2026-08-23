import { initContract } from '@ts-rest/core';
import { z } from 'zod';
import { studentWriteSchema } from '../schemas/students.dto.js';
import { baseListQuerySchema } from '../apiSchemas.js';

const c = initContract();

const errorResponse = z.unknown();

export const studentListQuerySchema = baseListQuerySchema.extend({
  sessionId: z.string().optional(),
  className: z.string().optional(),
  status: z.string().optional(),
  gender: z.string().optional(),
  quickFilter: z.string().optional(),
}).passthrough();

export const studentContract = c.router({
  list: {
    method: 'GET',
    path: '/api/students',
    query: studentListQuerySchema,
    responses: {
      200: z.unknown(),
      403: errorResponse,
      500: errorResponse,
    },
    summary: 'List students',
  },
  create: {
    method: 'POST',
    path: '/api/students',
    body: studentWriteSchema,
    responses: {
      200: z.unknown(),
      201: z.unknown(),
      403: errorResponse,
      500: errorResponse,
    },
    summary: 'Create a new student',
  },
  get: {
    method: 'GET',
    path: '/api/students/:id',
    responses: {
      200: z.unknown(),
      403: errorResponse,
      404: errorResponse,
      500: errorResponse,
    },
    summary: 'Get a single student',
  },
  update: {
    method: 'PUT',
    path: '/api/students/:id',
    body: studentWriteSchema,
    responses: {
      200: z.unknown(),
      403: errorResponse,
      404: errorResponse,
      500: errorResponse,
    },
    summary: 'Update a student',
  },
  delete: {
    method: 'DELETE',
    path: '/api/students/:id',
    body: z.object({ deletionReason: z.string().optional() }).optional(),
    responses: {
      200: z.unknown(),
      403: errorResponse,
      404: errorResponse,
      500: errorResponse,
    },
    summary: 'Soft delete a student',
  },
  bulkStatus: {
    method: 'POST',
    path: '/api/students/bulk-status',
    body: z.unknown(),
    responses: {
      200: z.unknown(),
      403: errorResponse,
      500: errorResponse,
    },
    summary: 'Bulk update student status',
  },
  bulkEnroll: {
    method: 'POST',
    path: '/api/students/bulk-enroll',
    body: z.unknown(),
    responses: {
      200: z.unknown(),
      403: errorResponse,
      500: errorResponse,
    },
    summary: 'Bulk enroll students',
  },
  nextGrNumber: {
    method: 'GET',
    path: '/api/students/next-gr-number',
    query: z.object({
      registeredDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      template: z.string().max(64).optional(),
      digits: z.coerce.number().int().min(1).max(12).optional(),
      restartAnnually: z.enum(['true', 'false']).optional(),
    }),
    responses: {
      200: z.unknown(),
      400: errorResponse,
      403: errorResponse,
      500: errorResponse,
    },
    summary: 'Get next available GR number',
  },
  duplicateCheck: {
    method: 'POST',
    path: '/api/students/duplicate-check',
    body: z.unknown(),
    responses: {
      200: z.unknown(),
      403: errorResponse,
      500: errorResponse,
    },
    summary: 'Check for duplicate students',
  },
  migrateGrNumbers: {
    method: 'POST',
    path: '/api/students/migrate-gr-numbers',
    body: z.unknown(),
    responses: {
      200: z.unknown(),
      403: errorResponse,
      500: errorResponse,
    },
    summary: 'Migrate GR numbers',
  },
  restore: {
    method: 'POST',
    path: '/api/students/:id/restore',
    body: z.unknown(),
    responses: { 200: z.unknown(), 403: errorResponse, 404: errorResponse, 500: errorResponse },
    summary: 'Restore a soft-deleted student',
  },
  bulkDelete: {
    method: 'POST',
    path: '/api/students/bulk-delete',
    body: z.object({ ids: z.array(z.union([z.string(), z.number()])), deletionReason: z.string().optional() }),
    responses: { 200: z.unknown(), 403: errorResponse, 500: errorResponse },
    summary: 'Bulk delete students',
  },
  bulkRestore: {
    method: 'POST',
    path: '/api/students/bulk-restore',
    body: z.object({ ids: z.array(z.union([z.string(), z.number()])) }),
    responses: { 200: z.unknown(), 403: errorResponse, 500: errorResponse },
    summary: 'Bulk restore students',
  },
  exportAudit: {
    method: 'POST',
    path: '/api/students/export-audit',
    body: z.object({ count: z.number(), scope: z.enum(['all', 'filtered', 'selection']) }),
    responses: { 200: z.unknown(), 403: errorResponse, 500: errorResponse },
    summary: 'Log export audit',
  },
  setupAudit: {
    method: 'POST',
    path: '/api/students/setup-audit',
    body: z.object({ area: z.enum(['fields', 'preferences']), summary: z.string() }),
    responses: { 200: z.unknown(), 403: errorResponse, 500: errorResponse },
    summary: 'Log setup audit',
  },
  resolve: {
    method: 'POST',
    path: '/api/students/resolve',
    body: z.object({ ids: z.array(z.string()) }),
    responses: { 200: z.unknown(), 403: errorResponse, 500: errorResponse },
    summary: 'Resolve students by IDs',
  },
  linkedContactIds: {
    method: 'GET',
    path: '/api/students/linked-contact-ids',
    query: z.object({ excludeId: z.string().optional() }).optional(),
    responses: { 200: z.unknown(), 403: errorResponse, 500: errorResponse },
    summary: 'Get linked contact IDs',
  },
  widgetAggregates: {
    method: 'POST',
    path: '/api/students/widget-aggregates',
    body: z.object({ widgets: z.array(z.unknown()) }),
    responses: { 200: z.unknown(), 403: errorResponse, 500: errorResponse },
    summary: 'Get widget aggregates',
  },

  getFieldConfig: {
    method: 'GET',
    path: '/api/students/field-config',
    responses: { 200: z.unknown(), 403: errorResponse, 500: errorResponse },
    summary: 'Get field config',
  },
  updateFieldConfig: {
    method: 'PUT',
    path: '/api/students/field-config',
    body: z.unknown(),
    responses: { 200: z.unknown(), 403: errorResponse, 500: errorResponse },
    summary: 'Update field config',
  },
  getPreferences: {
    method: 'GET',
    path: '/api/students/preferences',
    responses: { 200: z.unknown(), 403: errorResponse, 500: errorResponse },
    summary: 'Get preferences',
  },
  updatePreferences: {
    method: 'PUT',
    path: '/api/students/preferences',
    body: z.unknown(),
    responses: { 200: z.unknown(), 403: errorResponse, 500: errorResponse },
    summary: 'Update preferences',
  },
  getLookups: {
    method: 'GET',
    path: '/api/students/lookups',
    responses: { 200: z.unknown(), 403: errorResponse, 500: errorResponse },
    summary: 'Get all lookups',
  },
  getLookupKind: {
    method: 'GET',
    path: '/api/students/lookups/:kind',
    responses: { 200: z.unknown(), 403: errorResponse, 500: errorResponse },
    summary: 'Get a specific lookup kind',
  },
});
