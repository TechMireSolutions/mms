import { initContract } from '@ts-rest/core';
import { z } from 'zod';
import { baseListQuerySchema } from '../apiSchemas.js';
import { enrollmentsReportAggregatesSchema } from '../enrollmentsReportAggregates.js';
import { reportComparisonQuerySchema } from '../reportComparisonQuery.js';

const c = initContract();
const errorResponse = z.unknown();

const bulkIdsBody = z.object({
  ids: z.array(z.string()),
  deletionReason: z.string().optional(),
});

export const enrollmentContract = c.router({
  list: {
    method: 'GET',
    path: '/api/enrollments',
    query: baseListQuerySchema,
    responses: { 200: z.unknown(), 403: errorResponse, 500: errorResponse },
    summary: 'List enrollments',
  },
  get: {
    method: 'GET',
    path: '/api/enrollments/:id',
    query: z.object({ includeDeleted: z.union([z.boolean(), z.literal('true'), z.literal('false')]).optional() }).optional(),
    responses: { 200: z.unknown(), 403: errorResponse, 404: errorResponse, 500: errorResponse },
    summary: 'Get a single enrollment',
  },
  create: {
    method: 'POST',
    path: '/api/enrollments',
    body: z.object({}).passthrough(),
    responses: { 201: z.unknown(), 400: errorResponse, 403: errorResponse, 500: errorResponse },
    summary: 'Create an enrollment',
  },
  update: {
    method: 'PUT',
    path: '/api/enrollments/:id',
    body: z.object({}).passthrough(),
    responses: { 200: z.unknown(), 403: errorResponse, 404: errorResponse, 500: errorResponse },
    summary: 'Update an enrollment',
  },
  delete: {
    method: 'DELETE',
    path: '/api/enrollments/:id',
    body: z.object({ deletionReason: z.string().optional() }).optional(),
    responses: { 200: z.unknown(), 403: errorResponse, 404: errorResponse, 500: errorResponse },
    summary: 'Soft delete an enrollment',
  },
  bulkDelete: {
    method: 'POST',
    path: '/api/enrollments/bulk-delete',
    body: bulkIdsBody,
    responses: { 200: z.unknown(), 403: errorResponse, 500: errorResponse },
    summary: 'Bulk soft-delete enrollments',
  },
  bulkRestore: {
    method: 'POST',
    path: '/api/enrollments/bulk-restore',
    body: bulkIdsBody,
    responses: { 200: z.unknown(), 403: errorResponse, 500: errorResponse },
    summary: 'Bulk restore enrollments',
  },
  restore: {
    method: 'POST',
    path: '/api/enrollments/:id/restore',
    body: z.object({}).passthrough(),
    responses: { 200: z.unknown(), 403: errorResponse, 404: errorResponse, 500: errorResponse },
    summary: 'Restore an enrollment',
  },
  exportAudit: {
    method: 'POST',
    path: '/api/enrollments/export-audit',
    body: z.object({}).passthrough(),
    responses: { 200: z.unknown(), 403: errorResponse, 404: errorResponse, 500: errorResponse },
    summary: 'Export audit log',
  },
  widgetAggregates: {
    method: 'POST',
    path: '/api/enrollments/widget-aggregates',
    body: z.object({}).passthrough(),
    responses: { 200: z.unknown(), 403: errorResponse, 404: errorResponse, 500: errorResponse },
    summary: 'Widget aggregates',
  },
  reportAggregates: {
    method: 'GET',
    path: '/api/enrollments/report-aggregates',
    query: reportComparisonQuerySchema.optional(),
    responses: { 200: enrollmentsReportAggregatesSchema, 403: errorResponse, 404: errorResponse, 500: errorResponse },
    summary: 'Report aggregates',
  },

  getFieldConfig: {
    method: 'GET',
    path: '/api/enrollments/field-config',
    responses: { 200: z.unknown(), 403: errorResponse, 500: errorResponse },
    summary: 'Get field config',
  },
  updateFieldConfig: {
    method: 'PUT',
    path: '/api/enrollments/field-config',
    body: z.unknown(),
    responses: { 200: z.unknown(), 403: errorResponse, 500: errorResponse },
    summary: 'Update field config',
  },
  getPreferences: {
    method: 'GET',
    path: '/api/enrollments/preferences',
    responses: { 200: z.unknown(), 403: errorResponse, 500: errorResponse },
    summary: 'Get preferences',
  },
  updatePreferences: {
    method: 'PUT',
    path: '/api/enrollments/preferences',
    body: z.unknown(),
    responses: { 200: z.unknown(), 403: errorResponse, 500: errorResponse },
    summary: 'Update preferences',
  },
  getLookups: {
    method: 'GET',
    path: '/api/enrollments/lookups',
    responses: { 200: z.unknown(), 403: errorResponse, 500: errorResponse },
    summary: 'Get all lookups',
  },
  getLookupKind: {
    method: 'GET',
    path: '/api/enrollments/lookups/:kind',
    responses: { 200: z.unknown(), 403: errorResponse, 500: errorResponse },
    summary: 'Get a specific lookup kind',
  },
});
