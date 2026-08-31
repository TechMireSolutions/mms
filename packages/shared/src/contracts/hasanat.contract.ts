import { initContract } from '@ts-rest/core';
import { z } from 'zod';
import { baseListQuerySchema } from '../apiSchemas.js';
import { hasanatReportAggregatesSchema } from '../hasanatReportAggregates.js';
import { reportComparisonQuerySchema } from '../reportComparisonQuery.js';

const c = initContract();
const errorResponse = z.unknown();
const ok = z.unknown();
const bulkIds = z.object({ ids: z.array(z.string()), deletionReason: z.string().optional() });

export const hasanatContract = c.router({
  listDistributions: {
    method: 'GET',
    path: '/api/hasanat/distributions',
    query: baseListQuerySchema,
    responses: { 200: ok, 403: ok, 500: ok },
    summary: 'List hasanat distributions',
  },
  bulkDeleteDistributions: {
    method: 'POST',
    path: '/api/hasanat/distributions/bulk-delete',
    body: bulkIds,
    responses: { 200: ok, 403: ok, 500: ok },
    summary: 'Bulk soft-delete distributions',
  },
  bulkRestoreDistributions: {
    method: 'POST',
    path: '/api/hasanat/distributions/bulk-restore',
    body: bulkIds,
    responses: { 200: ok, 403: ok, 500: ok },
    summary: 'Bulk restore distributions',
  },
  listDenoms: {
    method: 'GET',
    path: '/api/hasanat/denoms',
    query: z.object({}).optional(),
    responses: { 200: ok, 403: ok, 500: ok },
    summary: 'List hasanat denominations',
  },
  listBatches: {
    method: 'GET',
    path: '/api/hasanat/batches',
    query: z.object({}).optional(),
    responses: { 200: ok, 403: ok, 500: ok },
    summary: 'List hasanat batches',
  },
  listRedemptions: {
    method: 'GET',
    path: '/api/hasanat/redemptions',
    query: z.object({}).optional(),
    responses: { 200: ok, 403: ok, 500: ok },
    summary: 'List hasanat redemptions',
  },
  reportAggregates: {
    method: 'GET',
    path: '/api/hasanat/report-aggregates',
    query: reportComparisonQuerySchema.optional(),
    responses: { 200: hasanatReportAggregatesSchema, 403: ok, 500: ok },
    summary: 'Report aggregates',
  },
  replaceDenoms: {
    method: 'PUT',
    path: '/api/hasanat/denoms/bulk',
    body: z.object({}).passthrough(),
    responses: { 200: ok, 403: ok, 500: ok },
    summary: 'Replace denoms',
  },
  replaceBatches: {
    method: 'PUT',
    path: '/api/hasanat/batches/bulk',
    body: z.object({}).passthrough(),
    responses: { 200: ok, 403: ok, 500: ok },
    summary: 'Replace batches',
  },
  replaceDistributions: {
    method: 'PUT',
    path: '/api/hasanat/distributions/bulk',
    body: z.object({}).passthrough(),
    responses: { 200: ok, 403: ok, 500: ok },
    summary: 'Replace distributions',
  },
  replaceRedemptions: {
    method: 'PUT',
    path: '/api/hasanat/redemptions/bulk',
    body: z.object({}).passthrough(),
    responses: { 200: ok, 403: ok, 500: ok },
    summary: 'Replace redemptions',
  },
  deleteDistribution: {
    method: 'DELETE',
    path: '/api/hasanat/distributions/:id',
    body: z.object({}).passthrough().optional(),
    responses: { 200: ok, 403: ok, 404: ok, 500: ok },
    summary: 'Delete distribution',
  },
  restoreDistribution: {
    method: 'POST',
    path: '/api/hasanat/distributions/:id/restore',
    body: z.object({}).passthrough(),
    responses: { 200: ok, 403: ok, 404: ok, 500: ok },
    summary: 'Restore distribution',
  },
  widgetAggregates: {
    method: 'POST',
    path: '/api/hasanat/widget-aggregates',
    body: z.object({ widgets: z.array(z.unknown()) }),
    responses: { 200: z.unknown(), 403: errorResponse, 500: errorResponse },
    summary: 'Get widget aggregates',
  },

  getFieldConfig: {
    method: 'GET',
    path: '/api/hasanat/field-config',
    responses: { 200: z.unknown(), 403: errorResponse, 500: errorResponse },
    summary: 'Get field config',
  },
  updateFieldConfig: {
    method: 'PUT',
    path: '/api/hasanat/field-config',
    body: z.unknown(),
    responses: { 200: z.unknown(), 403: errorResponse, 500: errorResponse },
    summary: 'Update field config',
  },
  getPreferences: {
    method: 'GET',
    path: '/api/hasanat/preferences',
    responses: { 200: z.unknown(), 403: errorResponse, 500: errorResponse },
    summary: 'Get preferences',
  },
  updatePreferences: {
    method: 'PUT',
    path: '/api/hasanat/preferences',
    body: z.unknown(),
    responses: { 200: z.unknown(), 403: errorResponse, 500: errorResponse },
    summary: 'Update preferences',
  },
  getLookups: {
    method: 'GET',
    path: '/api/hasanat/lookups',
    responses: { 200: z.unknown(), 403: errorResponse, 500: errorResponse },
    summary: 'Get all lookups',
  },
  getLookupKind: {
    method: 'GET',
    path: '/api/hasanat/lookups/:kind',
    responses: { 200: z.unknown(), 403: errorResponse, 500: errorResponse },
    summary: 'Get a specific lookup kind',
  },
});
