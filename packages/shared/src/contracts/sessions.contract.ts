import { initContract } from '@ts-rest/core';
import { z } from 'zod';
import { baseListQuerySchema } from '../apiSchemas.js';
import { sessionCreateBodySchema, sessionsBulkIdsSchema } from '../schemas/sessions.dto.js';

import { sessionsBulkStatusSchema } from '../sessionsModuleManifest.js';
import { sessionsReportAggregatesSchema } from '../sessionsReportAggregates.js';

const c = initContract();
const errorResponse = z.unknown();

const bulkResultSchema = z.object({
  success: z.boolean(),
  count: z.number().optional(),
});

export const sessionContract = c.router({
  list: {
    method: 'GET',
    path: '/api/sessions',
    query: baseListQuerySchema,
    responses: { 200: z.unknown() },
    summary: 'List sessions',
  },
  create: {
    method: 'POST',
    path: '/api/sessions',
    body: sessionCreateBodySchema,
    responses: {
      201: z.object({ session: z.any() }),
      400: z.object({ type: z.string(), message: z.string() }),
      403: z.object({ type: z.string(), message: z.string() }),
    },
    summary: 'Create a session',
  },
  bulkDelete: {
    method: 'POST',
    path: '/api/sessions/bulk-delete',
    body: sessionsBulkIdsSchema,
    responses: {
      200: bulkResultSchema,
      400: z.object({ type: z.string(), message: z.string() }),
      403: z.object({ type: z.string(), message: z.string() }),
    },
    summary: 'Bulk soft-delete sessions',
  },
  bulkStatus: {
    method: 'POST',
    path: '/api/sessions/bulk-status',
    body: sessionsBulkStatusSchema,
    responses: {
      200: bulkResultSchema,
      400: z.object({ type: z.string(), message: z.string() }),
      403: z.object({ type: z.string(), message: z.string() }),
    },
    summary: 'Bulk update session status',
  },
  bulkRestore: {
    method: 'POST',
    path: '/api/sessions/bulk-restore',
    body: sessionsBulkIdsSchema,
    responses: {
      200: bulkResultSchema,
      400: z.object({ type: z.string(), message: z.string() }),
      403: z.object({ type: z.string(), message: z.string() }),
    },
    summary: 'Bulk restore sessions',
  },
  update: {
    method: 'PUT',
    path: '/api/sessions/:id',
    body: z.object({}).passthrough(),
    responses: { 200: z.unknown(), 400: z.unknown(), 403: z.unknown(), 404: z.unknown(), 500: z.unknown() },
    summary: 'Update session',
  },
  delete: {
    method: 'DELETE',
    path: '/api/sessions/:id',
    body: z.object({}).passthrough().optional(),
    responses: { 200: z.unknown(), 400: z.unknown(), 403: z.unknown(), 404: z.unknown(), 500: z.unknown() },
    summary: 'Delete session',
  },
  restore: {
    method: 'POST',
    path: '/api/sessions/:id/restore',
    body: z.object({}).passthrough(),
    responses: { 200: z.unknown(), 400: z.unknown(), 403: z.unknown(), 404: z.unknown(), 500: z.unknown() },
    summary: 'Restore session',
  },
  exportAudit: {
    method: 'POST',
    path: '/api/sessions/export-audit',
    body: z.object({}).passthrough(),
    responses: { 200: z.unknown(), 400: z.unknown(), 403: z.unknown(), 404: z.unknown(), 500: z.unknown() },
    summary: 'Export audit',
  },
  widgetAggregates: {
    method: 'POST',
    path: '/api/sessions/widget-aggregates',
    body: z.object({}).passthrough(),
    responses: { 200: z.unknown(), 400: z.unknown(), 403: z.unknown(), 404: z.unknown(), 500: z.unknown() },
    summary: 'Widget aggregates',
  },
  reportAggregates: {
    method: 'GET',
    path: '/api/sessions/report-aggregates',
    responses: { 200: sessionsReportAggregatesSchema, 400: z.unknown(), 403: z.unknown(), 404: z.unknown(), 500: z.unknown() },
    summary: 'Report aggregates',
  },

  getFieldConfig: {
    method: 'GET',
    path: '/api/sessions/field-config',
    responses: { 200: z.unknown(), 403: errorResponse, 500: errorResponse },
    summary: 'Get field config',
  },
  updateFieldConfig: {
    method: 'PUT',
    path: '/api/sessions/field-config',
    body: z.unknown(),
    responses: { 200: z.unknown(), 403: errorResponse, 500: errorResponse },
    summary: 'Update field config',
  },
  getPreferences: {
    method: 'GET',
    path: '/api/sessions/preferences',
    responses: { 200: z.unknown(), 403: errorResponse, 500: errorResponse },
    summary: 'Get preferences',
  },
  updatePreferences: {
    method: 'PUT',
    path: '/api/sessions/preferences',
    body: z.unknown(),
    responses: { 200: z.unknown(), 403: errorResponse, 500: errorResponse },
    summary: 'Update preferences',
  },
  getLookups: {
    method: 'GET',
    path: '/api/sessions/lookups',
    responses: { 200: z.unknown(), 403: errorResponse, 500: errorResponse },
    summary: 'Get all lookups',
  },
  getLookupKind: {
    method: 'GET',
    path: '/api/sessions/lookups/:kind',
    responses: { 200: z.unknown(), 403: errorResponse, 500: errorResponse },
    summary: 'Get a specific lookup kind',
  },
});
