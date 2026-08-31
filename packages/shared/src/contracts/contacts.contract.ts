import { initContract } from '@ts-rest/core';
import { z } from 'zod';
import { baseListQuerySchema } from '../apiSchemas.js';

const c = initContract();

export const contactsReportAnalyticsQuerySchema = z.object({
  years: z
    .union([z.string(), z.array(z.number())])
    .optional()
    .transform((value) => {
      if (Array.isArray(value)) return value;
      return value
        ? value
            .split(',')
            .map((year) => Number.parseInt(year.trim(), 10))
            .filter((year) => Number.isFinite(year) && year >= 1900 && year <= 2100)
        : [];
    }),
  lang: z.string().max(16).optional(),
});

export const contactsContract = c.router({
  list: {
    method: 'GET',
    path: '/api/contacts',
    query: baseListQuerySchema,
    responses: {
      200: z.unknown(),
    },
    summary: 'List contacts',
  },
  create: {
    method: 'POST',
    path: '/api/contacts',
    body: z.unknown(),
    responses: {
      200: z.unknown(),
      201: z.unknown(),
    },
    summary: 'Create a new contact',
  },
  get: {
    method: 'GET',
    path: '/api/contacts/:id',
    pathParams: z.object({ id: z.string() }),
    responses: {
      200: z.unknown(),
      404: z.unknown(),
    },
    summary: 'Get a contact by ID',
  },
  update: {
    method: 'PUT',
    path: '/api/contacts/:id',
    pathParams: z.object({ id: z.string() }),
    body: z.unknown(),
    responses: {
      200: z.unknown(),
      400: z.unknown(),
      404: z.unknown(),
    },
    summary: 'Update a contact',
  },
  delete: {
    method: 'DELETE',
    path: '/api/contacts/:id',
    pathParams: z.object({ id: z.string() }),
    body: z.unknown(),
    responses: {
      200: z.unknown(),
      404: z.unknown(),
    },
    summary: 'Delete a contact',
  },
  reportAnalytics: {
    method: 'GET',
    path: '/api/contacts/report-analytics',
    query: contactsReportAnalyticsQuerySchema,
    responses: {
      200: z.unknown(),
      403: z.unknown(),
      500: z.unknown(),
    },
    summary: 'Get contact report analytics',
  },
  restore: {
    method: 'POST',
    path: '/api/contacts/:id/restore',
    body: z.unknown(),
    responses: { 200: z.unknown(), 404: z.unknown(), 500: z.unknown() },
    summary: 'Restore a contact',
  },
  bulkDelete: {
    method: 'POST',
    path: '/api/contacts/bulk-delete',
    body: z.object({ ids: z.array(z.string()), deletionReason: z.string().optional() }),
    responses: { 200: z.unknown(), 500: z.unknown() },
    summary: 'Bulk delete contacts',
  },
  bulkRestore: {
    method: 'POST',
    path: '/api/contacts/bulk-restore',
    body: z.object({ ids: z.array(z.string()) }),
    responses: { 200: z.unknown(), 500: z.unknown() },
    summary: 'Bulk restore contacts',
  },
  exportAudit: {
    method: 'POST',
    path: '/api/contacts/export-audit',
    body: z.object({ count: z.number(), scope: z.enum(['all', 'filtered', 'selection']) }),
    responses: { 200: z.unknown(), 500: z.unknown() },
    summary: 'Log export audit',
  },
  setupAudit: {
    method: 'POST',
    path: '/api/contacts/setup-audit',
    body: z.object({ area: z.enum(['fields', 'preferences']), summary: z.string() }),
    responses: { 200: z.unknown(), 500: z.unknown() },
    summary: 'Log setup audit',
  },
  resolve: {
    method: 'POST',
    path: '/api/contacts/resolve',
    body: z.object({ ids: z.array(z.string()) }),
    responses: { 200: z.unknown(), 500: z.unknown() },
    summary: 'Resolve contacts by IDs',
  },
  merge: {
    method: 'POST',
    path: '/api/contacts/merge',
    body: z.unknown(),
    responses: { 200: z.unknown(), 400: z.unknown(), 500: z.unknown() },
    summary: 'Merge contacts',
  },
  identityMatch: {
    method: 'POST',
    path: '/api/contacts/identity-match',
    body: z.unknown(),
    responses: { 200: z.unknown(), 400: z.unknown(), 500: z.unknown() },
    summary: 'Match contact identity',
  },
  bulkTag: {
    method: 'POST',
    path: '/api/contacts/bulk-tag',
    body: z.unknown(),
    responses: { 200: z.unknown(), 500: z.unknown() },
    summary: 'Bulk tag contacts',
  },
  widgetAggregates: {
    method: 'POST',
    path: '/api/contacts/widget-aggregates',
    body: z.object({ widgets: z.array(z.unknown()) }),
    responses: { 200: z.unknown(), 403: z.unknown(), 500: z.unknown() },
    summary: 'Get widget aggregates',
  },
  getFieldConfig: {
    method: 'GET',
    path: '/api/contacts/field-config',
    responses: { 200: z.object({ config: z.unknown().nullable() }), 403: z.unknown(), 500: z.unknown() },
    summary: 'Get contact field config',
  },
  updateFieldConfig: {
    method: 'PUT',
    path: '/api/contacts/field-config',
    body: z.unknown(),
    responses: { 200: z.object({ success: z.boolean(), config: z.unknown() }), 400: z.unknown(), 403: z.unknown(), 500: z.unknown() },
    summary: 'Update contact field config',
  },
  getPreferences: {
    method: 'GET',
    path: '/api/contacts/preferences',
    responses: { 200: z.object({ preferences: z.unknown().nullable() }), 403: z.unknown(), 500: z.unknown() },
    summary: 'Get contact preferences',
  },
  updatePreferences: {
    method: 'PUT',
    path: '/api/contacts/preferences',
    body: z.unknown(),
    responses: { 200: z.object({ success: z.boolean(), preferences: z.unknown() }), 400: z.unknown(), 403: z.unknown(), 500: z.unknown() },
    summary: 'Update contact preferences',
  },
  getDuplicates: {
    method: 'GET',
    path: '/api/contacts/duplicates',
    query: baseListQuerySchema,
    responses: { 200: z.unknown(), 403: z.unknown(), 500: z.unknown() },
    summary: 'Get contact duplicates',
  },
  getColumnPreferences: {
    method: 'GET',
    path: '/api/contacts/column-preferences',
    responses: { 200: z.unknown(), 403: z.unknown(), 500: z.unknown() },
    summary: 'Get contact column preferences',
  },
  updateColumnPreferences: {
    method: 'PUT',
    path: '/api/contacts/column-preferences',
    body: z.object({ preferences: z.array(z.unknown()) }),
    responses: { 200: z.unknown(), 403: z.unknown(), 500: z.unknown() },
    summary: 'Update contact column preferences',
  },
  getSavedReports: {
    method: 'GET',
    path: '/api/contacts/saved-reports',
    responses: { 200: z.unknown(), 403: z.unknown(), 500: z.unknown() },
    summary: 'Get contact saved reports',
  },
  createSavedReport: {
    method: 'POST',
    path: '/api/contacts/saved-reports',
    body: z.unknown(),
    responses: { 200: z.unknown(), 400: z.unknown(), 500: z.unknown() },
    summary: 'Create contact saved report',
  },
  deleteSavedReport: {
    method: 'DELETE',
    path: '/api/contacts/saved-reports/:id',
    pathParams: z.object({ id: z.string() }),
    body: z.unknown(),
    responses: { 200: z.unknown(), 404: z.unknown(), 500: z.unknown() },
    summary: 'Delete contact saved report',
  },
  runSavedReport: {
    method: 'POST',
    path: '/api/contacts/saved-reports/:id/run',
    pathParams: z.object({ id: z.string() }),
    body: z.unknown(),
    responses: { 200: z.unknown(), 404: z.unknown(), 500: z.unknown() },
    summary: 'Run contact saved report',
  },
  getLookups: {
    method: 'GET',
    path: '/api/contacts/lookups',
    responses: { 200: z.unknown(), 403: z.unknown(), 500: z.unknown() },
    summary: 'Get contact lookups',
  },
  updateLookups: {
    method: 'PUT',
    path: '/api/contacts/lookups/:kind',
    pathParams: z.object({ kind: z.string() }),
    body: z.unknown(),
    responses: { 200: z.unknown(), 400: z.unknown(), 403: z.unknown(), 500: z.unknown() },
    summary: 'Update contact lookups',
  },
  duplicateCheck: {
    method: 'POST',
    path: '/api/contacts/duplicate-check',
    body: z.object({ contact: z.unknown() }),
    responses: { 200: z.unknown(), 500: z.unknown() },
    summary: 'Check for duplicate contacts',
  },
  getGoogleSyncConfig: {
    method: 'GET',
    path: '/api/contacts/google-sync',
    responses: { 200: z.unknown(), 403: z.unknown(), 500: z.unknown() },
    summary: 'Get Google Sync config',
  },
  updateGoogleSyncConfig: {
    method: 'PUT',
    path: '/api/contacts/google-sync',
    body: z.unknown(),
    responses: { 200: z.unknown(), 400: z.unknown(), 403: z.unknown(), 500: z.unknown() },
    summary: 'Update Google Sync config',
  },
  logGoogleSyncAudit: {
    method: 'POST',
    path: '/api/contacts/google-sync/audit',
    body: z.unknown(),
    responses: { 200: z.unknown(), 400: z.unknown(), 403: z.unknown(), 500: z.unknown() },
    summary: 'Log Google Sync audit',
  },
  exchangeGoogleSyncOAuth: {
    method: 'POST',
    path: '/api/contacts/google-sync/exchange',
    body: z.unknown(),
    responses: { 200: z.unknown(), 400: z.unknown(), 403: z.unknown(), 500: z.unknown() },
    summary: 'Exchange Google Sync OAuth code',
  },
  runGoogleSync: {
    method: 'POST',
    path: '/api/contacts/google-sync/run',
    body: z.unknown(),
    responses: { 200: z.unknown(), 403: z.unknown(), 500: z.unknown() },
    summary: 'Run Google Sync',
  },
  getFieldUsage: {
    method: 'GET',
    path: '/api/contacts/field-usage/:fieldId',
    pathParams: z.object({ fieldId: z.string() }),
    responses: { 200: z.unknown(), 500: z.unknown() },
    summary: 'Get single field usage count',
  },
  getFieldsUsage: {
    method: 'POST',
    path: '/api/contacts/field-usage',
    body: z.object({ fieldKeys: z.array(z.string()) }),
    responses: { 200: z.unknown(), 500: z.unknown() },
    summary: 'Get multiple fields usage counts',
  },
});
