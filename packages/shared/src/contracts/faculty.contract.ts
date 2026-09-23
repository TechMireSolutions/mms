import { initContract } from '@ts-rest/core';
import { z } from 'zod';
import {
  facultyRecordSchema,
  facultyBulkStatusSchema,
  facultyBulkSpecializationSchema,
  facultyNextEmployeeIdQuerySchema,
} from '../facultyModuleManifest.js';
import { facultyListQuerySchema } from '../facultyListQuery.js';
import { facultyLookupsMapSchema } from '../facultyLookupTypes.js';
import {
  facultyWriteSchema,
  facultyDuplicateCheckBodySchema,
} from '../schemas/faculty.dto.js';
import {
  facultyDesignationAssignmentSchema,
  facultyDesignationAssignmentWriteSchema,
  facultyDesignationSchema,
  facultyDesignationWriteSchema,
} from '../facultyDesignationTypes.js';
import {
  facultyBulkResultResponseSchema,
  facultyListPageResponseSchema,
  facultyPreferencesResponseSchema,
  facultyWidgetAggregateResultSchema,
  facultyWrappedResponseSchema,
} from './faculty.contract.schemas.js';

export {
  facultyListPageResponseSchema,
  facultyPreferencesResponseSchema,
};

const c = initContract();
const errorResponse = z.unknown();

export const facultyContract = c.router({
  list: {
    method: 'GET',
    path: '/api/faculty',
    query: facultyListQuerySchema,
    responses: { 200: facultyListPageResponseSchema, 403: errorResponse, 500: errorResponse },
    summary: 'List faculty members',
  },
  get: {
    method: 'GET',
    path: '/api/faculty/:id',
    query: z.object({ includeDeleted: z.union([z.boolean(), z.literal('true'), z.literal('false')]).optional() }).optional(),
    responses: { 200: z.object({ faculty: facultyRecordSchema.optional(), facultyMember: facultyRecordSchema.optional(), teacher: facultyRecordSchema.optional() }), 403: errorResponse, 404: errorResponse, 500: errorResponse },
    summary: 'Get a single faculty member',
  },
  create: {
    method: 'POST',
    path: '/api/faculty',
    body: facultyWriteSchema,
    responses: { 200: facultyWrappedResponseSchema, 201: facultyWrappedResponseSchema, 403: errorResponse, 400: errorResponse, 500: errorResponse },
    summary: 'Create a faculty member',
  },
  update: {
    method: 'PUT',
    path: '/api/faculty/:id',
    body: facultyWriteSchema,
    responses: { 200: facultyWrappedResponseSchema, 403: errorResponse, 404: errorResponse, 400: errorResponse, 500: errorResponse },
    summary: 'Update a faculty member',
  },
  delete: {
    method: 'DELETE',
    path: '/api/faculty/:id',
    body: z.object({
      deletionReason: z.string().optional(),
      reassignSubordinatesTo: z.string().optional(),
    }).optional(),
    responses: { 200: z.object({ success: z.literal(true) }), 403: errorResponse, 404: errorResponse, 409: errorResponse, 500: errorResponse },
    summary: 'Soft delete a faculty member',
  },
  hierarchyTree: {
    method: 'GET',
    path: '/api/faculty/hierarchy-tree',
    responses: {
      200: z.object({
        nodes: z.array(z.record(z.string(), z.unknown())),
      }),
      403: errorResponse,
      500: errorResponse,
    },
    summary: 'Get organizational faculty hierarchy tree',
  },
  bulkStatus: {
    method: 'POST',
    path: '/api/faculty/bulk-status',
    body: facultyBulkStatusSchema,
    responses: { 200: facultyBulkResultResponseSchema, 400: errorResponse, 403: errorResponse, 500: errorResponse },
    summary: 'Bulk update faculty status',
  },
  bulkSpecialization: {
    method: 'POST',
    path: '/api/faculty/bulk-specialization',
    body: facultyBulkSpecializationSchema,
    responses: { 200: facultyBulkResultResponseSchema, 400: errorResponse, 403: errorResponse, 500: errorResponse },
    summary: 'Bulk update faculty specialization',
  },
  duplicateCheck: {
    method: 'POST',
    path: '/api/faculty/duplicate-check',
    body: facultyDuplicateCheckBodySchema,
    responses: {
      200: z.object({ reason: z.enum(['contact', 'employeeId']).nullable() }),
      400: errorResponse,
      403: errorResponse,
      500: errorResponse,
    },
    summary: 'Check for duplicate faculty registration',
  },
  nextEmployeeId: {
    method: 'GET',
    path: '/api/faculty/next-employee-id',
    query: facultyNextEmployeeIdQuerySchema,
    responses: { 200: z.object({ employeeId: z.string() }), 400: errorResponse, 403: errorResponse, 500: errorResponse },
    summary: 'Get next available employee ID',
  },
  migrateEmployeeIds: {
    method: 'POST',
    path: '/api/faculty/migrate-employee-ids',
    body: z.object({}).optional(),
    responses: { 200: z.object({ success: z.literal(true), updated: z.number() }), 403: errorResponse, 500: errorResponse },
    summary: 'Migrate faculty missing employee IDs',
  },
  restore: {
    method: 'POST',
    path: '/api/faculty/:id/restore',
    body: z.unknown(),
    responses: { 200: z.object({ success: z.literal(true) }), 403: errorResponse, 404: errorResponse, 500: errorResponse },
    summary: 'Restore a soft-deleted faculty member',
  },
  bulkDelete: {
    method: 'POST',
    path: '/api/faculty/bulk-delete',
    body: z.object({ ids: z.array(z.union([z.string(), z.number()])), deletionReason: z.string().optional() }),
    responses: { 200: facultyBulkResultResponseSchema, 403: errorResponse, 500: errorResponse },
    summary: 'Bulk delete faculty members',
  },
  bulkRestore: {
    method: 'POST',
    path: '/api/faculty/bulk-restore',
    body: z.object({ ids: z.array(z.union([z.string(), z.number()])) }),
    responses: { 200: facultyBulkResultResponseSchema, 403: errorResponse, 500: errorResponse },
    summary: 'Bulk restore faculty members',
  },
  exportAudit: {
    method: 'POST',
    path: '/api/faculty/export-audit',
    body: z.object({ count: z.number(), scope: z.enum(['all', 'filtered', 'selection']) }),
    responses: { 200: z.object({ success: z.literal(true) }), 403: errorResponse, 500: errorResponse },
    summary: 'Log export audit',
  },
  setupAudit: {
    method: 'POST',
    path: '/api/faculty/setup-audit',
    body: z.object({ area: z.enum(['fields', 'preferences']), summary: z.string() }),
    responses: { 200: z.object({ success: z.literal(true) }), 403: errorResponse, 500: errorResponse },
    summary: 'Log setup audit',
  },
  resolve: {
    method: 'POST',
    path: '/api/faculty/resolve',
    body: z.object({ ids: z.array(z.string()) }),
    responses: { 200: z.object({ faculty: z.array(facultyRecordSchema).optional(), teachers: z.array(facultyRecordSchema).optional() }), 403: errorResponse, 500: errorResponse },
    summary: 'Resolve faculty members by IDs',
  },
  linkedContactIds: {
    method: 'GET',
    path: '/api/faculty/linked-contact-ids',
    query: z.object({ excludeId: z.string().optional() }).optional(),
    responses: {
      200: z.object({ contactIds: z.array(z.union([z.string(), z.number()])) }),
      403: errorResponse,
      500: errorResponse,
    },
    summary: 'Get linked contact IDs',
  },
  widgetAggregates: {
    method: 'POST',
    path: '/api/faculty/widget-aggregates',
    body: z.object({ widgets: z.array(z.unknown()) }),
    responses: { 200: z.object({ results: z.record(z.string(), facultyWidgetAggregateResultSchema) }), 403: errorResponse, 500: errorResponse },
    summary: 'Get widget aggregates',
  },

  listDesignations: {
    method: 'GET',
    path: '/api/faculty/designations',
    responses: { 200: z.object({ designations: z.array(facultyDesignationSchema) }), 403: errorResponse, 500: errorResponse },
    summary: 'List Faculty designation definitions',
  },
  saveDesignation: {
    method: 'PUT',
    path: '/api/faculty/designations/:id',
    body: facultyDesignationWriteSchema,
    responses: { 200: z.object({ designation: facultyDesignationSchema }), 400: errorResponse, 403: errorResponse },
    summary: 'Create or update a Faculty designation definition',
  },
  listDesignationHistory: {
    method: 'GET',
    path: '/api/faculty/:facultyId/designation-history',
    responses: { 200: z.object({ assignments: z.array(facultyDesignationAssignmentSchema) }), 403: errorResponse, 500: errorResponse },
    summary: 'List dated designation history for a Faculty member',
  },
  saveDesignationAssignment: {
    method: 'PUT',
    path: '/api/faculty/:facultyId/designation-history/:assignmentId',
    body: facultyDesignationAssignmentWriteSchema,
    responses: { 200: z.object({ assignment: facultyDesignationAssignmentSchema }), 400: errorResponse, 403: errorResponse, 409: errorResponse },
    summary: 'Create or update a dated Faculty designation assignment',
  },
  deleteDesignationAssignment: {
    method: 'DELETE',
    path: '/api/faculty/:facultyId/designation-history/:assignmentId',
    body: z.object({}).optional(),
    responses: {
      200: z.object({ success: z.literal(true) }),
      403: errorResponse,
      404: errorResponse,
      409: errorResponse,
      500: errorResponse,
    },
    summary: 'Delete a dated Faculty designation assignment (forbidden when it is the sole assignment for the member)',
  },

  getFieldConfig: {
    method: 'GET',
    path: '/api/faculty/field-config',
    responses: { 200: z.object({ config: z.record(z.string(), z.unknown()).nullable() }), 403: errorResponse, 500: errorResponse },
    summary: 'Get field config',
  },
  updateFieldConfig: {
    method: 'PUT',
    path: '/api/faculty/field-config',
    body: z.unknown(),
    responses: { 200: z.object({ success: z.literal(true), config: z.record(z.string(), z.unknown()) }), 403: errorResponse, 500: errorResponse },
    summary: 'Update field config',
  },
  getPreferences: {
    method: 'GET',
    path: '/api/faculty/preferences',
    responses: { 200: z.object({ preferences: facultyPreferencesResponseSchema }), 403: errorResponse, 500: errorResponse },
    summary: 'Get preferences',
  },
  updatePreferences: {
    method: 'PUT',
    path: '/api/faculty/preferences',
    body: z.unknown(),
    responses: { 200: z.object({ success: z.literal(true), preferences: facultyPreferencesResponseSchema }), 403: errorResponse, 500: errorResponse },
    summary: 'Update preferences',
  },
  getLookups: {
    method: 'GET',
    path: '/api/faculty/lookups',
    responses: { 200: z.object({ lookups: facultyLookupsMapSchema }), 403: errorResponse, 500: errorResponse },
    summary: 'Get all lookups',
  },
  getLookupKind: {
    method: 'GET',
    path: '/api/faculty/lookups/:kind',
    responses: { 200: z.unknown(), 403: errorResponse, 500: errorResponse },
    summary: 'Get a specific lookup kind',
  },
  updateLookupKind: {
    method: 'PUT',
    path: '/api/faculty/lookups/:kind',
    body: z.object({ items: z.array(z.string()) }),
    responses: {
      200: z.object({ success: z.literal(true), kind: z.string(), items: z.array(z.string()) }),
      400: errorResponse,
      403: errorResponse,
      500: errorResponse,
    },
    summary: 'Update a specific lookup kind',
  },
});



export const teacherContract = facultyContract;
export const teacherListPageResponseSchema = facultyListPageResponseSchema;
