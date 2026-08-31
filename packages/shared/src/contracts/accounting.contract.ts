import { initContract } from '@ts-rest/core';
import { z } from 'zod';
import { baseListQuerySchema } from '../apiSchemas.js';
import {
  accountRecordSchema,
  journalEntryRecordSchema,
  fiscalYearRecordSchema,
} from '../accountingModuleManifest.js';
import {
  accountingReportAggregatesSchema,
  accountingReportQuerySchema,
} from '../accountingReportAggregates.js';

const c = initContract();
const errorResponse = z.unknown();
const ok = z.unknown();

/** Envelope for paginated chart-of-accounts responses. */
export const accountingAccountsPageResponseSchema = z.object({
  accounts: z.array(accountRecordSchema),
  total: z.number(),
  page: z.number(),
  limit: z.number(),
  hasMore: z.boolean(),
});

/** Envelope for paginated journal-entry responses. */
export const accountingEntriesPageResponseSchema = z.object({
  entries: z.array(journalEntryRecordSchema),
  total: z.number(),
  page: z.number(),
  limit: z.number(),
  hasMore: z.boolean(),
});

/** Envelope for paginated fiscal-year responses. */
export const accountingFiscalYearsPageResponseSchema = z.object({
  fiscalYears: z.array(fiscalYearRecordSchema),
  total: z.number(),
  page: z.number(),
  limit: z.number(),
  hasMore: z.boolean(),
});

/** `{ success: true, succeeded, failed }` bulk-operation envelope. */
const accountingBulkResultResponseSchema = z.object({
  success: z.literal(true),
  succeeded: z.number(),
  failed: z.number(),
});

/** Normalized Accounting Setup preferences (`AccountingModulePreferences`). */
export const accountingPreferencesResponseSchema = z.object({
  currency: z.string(),
  currencySymbol: z.string(),
  dateFormat: z.string(),
  decimalSeparator: z.enum(['period', 'comma']),
  decimalPlaces: z.number(),
  fyStartMonth: z.string(),
  accountCodeLength: z.number(),
  requireNarration: z.boolean(),
  allowEditPosted: z.boolean(),
  autoPostDrafts: z.boolean(),
  retainedEarningsAccount: z.string(),
  organizationName: z.string(),
  defaultViewLayout: z.string().optional(),
});

export const accountingContract = c.router({
  listAccounts: {
    method: 'GET',
    path: '/api/accounting/accounts',
    query: baseListQuerySchema,
    responses: {
      200: z.union([
        z.object({ accounts: z.array(accountRecordSchema) }),
        accountingAccountsPageResponseSchema,
      ]),
      403: ok,
      500: ok,
    },
    summary: 'List chart-of-accounts entries',
  },
  listEntries: {
    method: 'GET',
    path: '/api/accounting/entries',
    query: baseListQuerySchema,
    responses: {
      200: z.union([
        z.object({ entries: z.array(journalEntryRecordSchema) }),
        accountingEntriesPageResponseSchema,
      ]),
      403: ok,
      500: ok,
    },
    summary: 'List journal entries',
  },
  listFiscalYears: {
    method: 'GET',
    path: '/api/accounting/fiscal-years',
    query: baseListQuerySchema,
    responses: {
      200: z.union([
        z.object({ fiscalYears: z.array(fiscalYearRecordSchema) }),
        accountingFiscalYearsPageResponseSchema,
      ]),
      403: ok,
      500: ok,
    },
    summary: 'List fiscal years',
  },
  replaceAccounts: {
    method: 'PUT',
    path: '/api/accounting/accounts/bulk',
    body: ok,
    responses: { 200: z.object({ accounts: z.array(accountRecordSchema) }), 403: ok, 500: ok },
    summary: 'Replace all accounts',
  },
  replaceEntries: {
    method: 'PUT',
    path: '/api/accounting/entries/bulk',
    body: ok,
    responses: { 200: z.object({ entries: z.array(journalEntryRecordSchema) }), 403: ok, 500: ok },
    summary: 'Replace all entries',
  },
  replaceFiscalYears: {
    method: 'PUT',
    path: '/api/accounting/fiscal-years/bulk',
    body: ok,
    responses: { 200: z.object({ fiscalYears: z.array(fiscalYearRecordSchema) }), 403: ok, 500: ok },
    summary: 'Replace all fiscal years',
  },
  deleteEntry: {
    method: 'DELETE',
    path: '/api/accounting/entries/:id',
    body: ok,
    responses: { 200: z.object({ success: z.literal(true) }), 403: ok, 500: ok },
    summary: 'Delete entry',
  },
  restoreEntry: {
    method: 'POST',
    path: '/api/accounting/entries/:id/restore',
    body: ok,
    responses: { 200: z.object({ success: z.literal(true) }), 403: ok, 500: ok },
    summary: 'Restore entry',
  },
  bulkDeleteEntries: {
    method: 'POST',
    path: '/api/accounting/entries/bulk-delete',
    body: z.object({ ids: z.array(z.string()) }),
    responses: { 200: accountingBulkResultResponseSchema, 403: ok, 500: ok },
    summary: 'Bulk delete entries',
  },
  bulkRestoreEntries: {
    method: 'POST',
    path: '/api/accounting/entries/bulk-restore',
    body: z.object({ ids: z.array(z.string()) }),
    responses: { 200: accountingBulkResultResponseSchema, 403: ok, 500: ok },
    summary: 'Bulk restore entries',
  },

  getFieldConfig: {
    method: 'GET',
    path: '/api/accounting/field-config',
    responses: { 200: z.object({ config: z.record(z.string(), z.unknown()).nullable() }), 403: errorResponse, 500: errorResponse },
    summary: 'Get field config',
  },
  updateFieldConfig: {
    method: 'PUT',
    path: '/api/accounting/field-config',
    body: z.unknown(),
    responses: { 200: z.object({ success: z.literal(true), config: z.record(z.string(), z.unknown()) }), 403: errorResponse, 500: errorResponse },
    summary: 'Update field config',
  },
  getPreferences: {
    method: 'GET',
    path: '/api/accounting/preferences',
    responses: { 200: z.object({ preferences: accountingPreferencesResponseSchema }), 403: errorResponse, 500: errorResponse },
    summary: 'Get preferences',
  },
  updatePreferences: {
    method: 'PUT',
    path: '/api/accounting/preferences',
    body: z.unknown(),
    responses: { 200: z.object({ success: z.literal(true), preferences: accountingPreferencesResponseSchema }), 403: errorResponse, 500: errorResponse },
    summary: 'Update preferences',
  },
  getLookups: {
    method: 'GET',
    path: '/api/accounting/lookups',
    responses: { 200: z.unknown(), 403: errorResponse, 500: errorResponse },
    summary: 'Get all lookups',
  },
  getLookupKind: {
    method: 'GET',
    path: '/api/accounting/lookups/:kind',
    responses: { 200: z.unknown(), 403: errorResponse, 500: errorResponse },
    summary: 'Get a specific lookup kind',
  },
  getReportAggregates: {
    method: 'GET',
    path: '/api/accounting/report-aggregates',
    query: accountingReportQuerySchema.optional(),
    responses: { 200: accountingReportAggregatesSchema, 403: errorResponse, 500: errorResponse },
    summary: 'Get accounting report aggregates',
  },
});