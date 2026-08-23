import { initContract } from '@ts-rest/core';
import { z } from 'zod';
import { baseListQuerySchema } from '../apiSchemas.js';

const c = initContract();
const errorResponse = z.unknown();

export const teacherContract = c.router({
  list: {
    method: 'GET',
    path: '/api/teachers',
    query: baseListQuerySchema,
    responses: { 200: z.unknown(), 403: errorResponse, 500: errorResponse },
    summary: 'List teachers',
  },
  get: {
    method: 'GET',
    path: '/api/teachers/:id',
    query: z.object({ includeDeleted: z.union([z.boolean(), z.literal('true'), z.literal('false')]).optional() }).optional(),
    responses: { 200: z.unknown(), 403: errorResponse, 404: errorResponse, 500: errorResponse },
    summary: 'Get a single teacher',
  },
  create: {
    method: 'POST',
    path: '/api/teachers',
    body: z.unknown(),
    responses: { 200: z.unknown(), 201: z.unknown(), 403: errorResponse, 400: errorResponse, 500: errorResponse },
    summary: 'Create a teacher',
  },
  update: {
    method: 'PUT',
    path: '/api/teachers/:id',
    body: z.unknown(),
    responses: { 200: z.unknown(), 403: errorResponse, 404: errorResponse, 400: errorResponse, 500: errorResponse },
    summary: 'Update a teacher',
  },
  delete: {
    method: 'DELETE',
    path: '/api/teachers/:id',
    body: z.object({ deletionReason: z.string().optional() }).optional(),
    responses: { 200: z.unknown(), 403: errorResponse, 404: errorResponse, 500: errorResponse },
    summary: 'Soft delete a teacher',
  },
  bulkStatus: {
    method: 'POST',
    path: '/api/teachers/bulk-status',
    body: z.unknown(),
    responses: { 200: z.unknown(), 400: errorResponse, 403: errorResponse, 500: errorResponse },
    summary: 'Bulk update teacher status',
  },
  bulkSpecialization: {
    method: 'POST',
    path: '/api/teachers/bulk-specialization',
    body: z.unknown(),
    responses: { 200: z.unknown(), 400: errorResponse, 403: errorResponse, 500: errorResponse },
    summary: 'Bulk update teacher specialization',
  },
  duplicateCheck: {
    method: 'POST',
    path: '/api/teachers/duplicate-check',
    body: z.unknown(),
    responses: { 200: z.unknown(), 400: errorResponse, 403: errorResponse, 500: errorResponse },
    summary: 'Check for duplicate teacher registration',
  },
  nextEmployeeId: {
    method: 'GET',
    path: '/api/teachers/next-employee-id',
    query: z.object({
      prefix: z.string().optional(),
    }),
    responses: { 200: z.unknown(), 400: errorResponse, 403: errorResponse, 500: errorResponse },
    summary: 'Get next available employee ID',
  },
  migrateEmployeeIds: {
    method: 'POST',
    path: '/api/teachers/migrate-employee-ids',
    body: z.object({}).optional(),
    responses: { 200: z.unknown(), 403: errorResponse, 500: errorResponse },
    summary: 'Migrate teachers missing employee IDs',
  },
  restore: {
    method: 'POST',
    path: '/api/teachers/:id/restore',
    body: z.unknown(),
    responses: { 200: z.unknown(), 403: errorResponse, 404: errorResponse, 500: errorResponse },
    summary: 'Restore a soft-deleted teacher',
  },
  bulkDelete: {
    method: 'POST',
    path: '/api/teachers/bulk-delete',
    body: z.object({ ids: z.array(z.union([z.string(), z.number()])), deletionReason: z.string().optional() }),
    responses: { 200: z.unknown(), 403: errorResponse, 500: errorResponse },
    summary: 'Bulk delete teachers',
  },
  bulkRestore: {
    method: 'POST',
    path: '/api/teachers/bulk-restore',
    body: z.object({ ids: z.array(z.union([z.string(), z.number()])) }),
    responses: { 200: z.unknown(), 403: errorResponse, 500: errorResponse },
    summary: 'Bulk restore teachers',
  },
  exportAudit: {
    method: 'POST',
    path: '/api/teachers/export-audit',
    body: z.object({ count: z.number(), scope: z.enum(['all', 'filtered', 'selection']) }),
    responses: { 200: z.unknown(), 403: errorResponse, 500: errorResponse },
    summary: 'Log export audit',
  },
  setupAudit: {
    method: 'POST',
    path: '/api/teachers/setup-audit',
    body: z.object({ area: z.enum(['fields', 'preferences']), summary: z.string() }),
    responses: { 200: z.unknown(), 403: errorResponse, 500: errorResponse },
    summary: 'Log setup audit',
  },
  resolve: {
    method: 'POST',
    path: '/api/teachers/resolve',
    body: z.object({ ids: z.array(z.string()) }),
    responses: { 200: z.unknown(), 403: errorResponse, 500: errorResponse },
    summary: 'Resolve teachers by IDs',
  },
  linkedContactIds: {
    method: 'GET',
    path: '/api/teachers/linked-contact-ids',
    query: z.object({ excludeId: z.string().optional() }).optional(),
    responses: { 200: z.unknown(), 403: errorResponse, 500: errorResponse },
    summary: 'Get linked contact IDs',
  },
  widgetAggregates: {
    method: 'POST',
    path: '/api/teachers/widget-aggregates',
    body: z.object({ widgets: z.array(z.unknown()) }),
    responses: { 200: z.unknown(), 403: errorResponse, 500: errorResponse },
    summary: 'Get widget aggregates',
  },

  getFieldConfig: {
    method: 'GET',
    path: '/api/teachers/field-config',
    responses: { 200: z.unknown(), 403: errorResponse, 500: errorResponse },
    summary: 'Get field config',
  },
  updateFieldConfig: {
    method: 'PUT',
    path: '/api/teachers/field-config',
    body: z.unknown(),
    responses: { 200: z.unknown(), 403: errorResponse, 500: errorResponse },
    summary: 'Update field config',
  },
  getPreferences: {
    method: 'GET',
    path: '/api/teachers/preferences',
    responses: { 200: z.unknown(), 403: errorResponse, 500: errorResponse },
    summary: 'Get preferences',
  },
  updatePreferences: {
    method: 'PUT',
    path: '/api/teachers/preferences',
    body: z.unknown(),
    responses: { 200: z.unknown(), 403: errorResponse, 500: errorResponse },
    summary: 'Update preferences',
  },
  getLookups: {
    method: 'GET',
    path: '/api/teachers/lookups',
    responses: { 200: z.unknown(), 403: errorResponse, 500: errorResponse },
    summary: 'Get all lookups',
  },
  getLookupKind: {
    method: 'GET',
    path: '/api/teachers/lookups/:kind',
    responses: { 200: z.unknown(), 403: errorResponse, 500: errorResponse },
    summary: 'Get a specific lookup kind',
  },
});
