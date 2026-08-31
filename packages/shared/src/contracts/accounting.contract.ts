import { initContract } from '@ts-rest/core';
import { z } from 'zod';
import { baseListQuerySchema } from '../apiSchemas.js';
import {
  accountingReportAggregatesSchema,
  accountingReportQuerySchema,
} from '../accountingReportAggregates.js';

const c = initContract();
const errorResponse = z.unknown();
const ok = z.unknown();

export const accountingContract = c.router({
  listAccounts: {
    method: 'GET',
    path: '/api/accounting/accounts',
    query: baseListQuerySchema,
    responses: { 200: ok, 403: ok, 500: ok },
    summary: 'List chart-of-accounts entries',
  },
  listEntries: {
    method: 'GET',
    path: '/api/accounting/entries',
    query: baseListQuerySchema,
    responses: { 200: ok, 403: ok, 500: ok },
    summary: 'List journal entries',
  },
  listFiscalYears: {
    method: 'GET',
    path: '/api/accounting/fiscal-years',
    query: baseListQuerySchema,
    responses: { 200: ok, 403: ok, 500: ok },
    summary: 'List fiscal years',
  },
  replaceAccounts: {
    method: 'PUT',
    path: '/api/accounting/accounts/bulk',
    body: ok,
    responses: { 200: ok, 403: ok, 500: ok },
    summary: 'Replace all accounts',
  },
  replaceEntries: {
    method: 'PUT',
    path: '/api/accounting/entries/bulk',
    body: ok,
    responses: { 200: ok, 403: ok, 500: ok },
    summary: 'Replace all entries',
  },
  replaceFiscalYears: {
    method: 'PUT',
    path: '/api/accounting/fiscal-years/bulk',
    body: ok,
    responses: { 200: ok, 403: ok, 500: ok },
    summary: 'Replace all fiscal years',
  },
  deleteEntry: {
    method: 'DELETE',
    path: '/api/accounting/entries/:id',
    body: ok,
    responses: { 200: ok, 403: ok, 500: ok },
    summary: 'Delete entry',
  },
  restoreEntry: {
    method: 'POST',
    path: '/api/accounting/entries/:id/restore',
    body: ok,
    responses: { 200: ok, 403: ok, 500: ok },
    summary: 'Restore entry',
  },
  bulkDeleteEntries: {
    method: 'POST',
    path: '/api/accounting/entries/bulk-delete',
    body: z.object({ ids: z.array(z.string()) }),
    responses: { 200: ok, 403: ok, 500: ok },
    summary: 'Bulk delete entries',
  },
  bulkRestoreEntries: {
    method: 'POST',
    path: '/api/accounting/entries/bulk-restore',
    body: z.object({ ids: z.array(z.string()) }),
    responses: { 200: ok, 403: ok, 500: ok },
    summary: 'Bulk restore entries',
  },

  getFieldConfig: {
    method: 'GET',
    path: '/api/accounting/field-config',
    responses: { 200: z.unknown(), 403: errorResponse, 500: errorResponse },
    summary: 'Get field config',
  },
  updateFieldConfig: {
    method: 'PUT',
    path: '/api/accounting/field-config',
    body: z.unknown(),
    responses: { 200: z.unknown(), 403: errorResponse, 500: errorResponse },
    summary: 'Update field config',
  },
  getPreferences: {
    method: 'GET',
    path: '/api/accounting/preferences',
    responses: { 200: z.unknown(), 403: errorResponse, 500: errorResponse },
    summary: 'Get preferences',
  },
  updatePreferences: {
    method: 'PUT',
    path: '/api/accounting/preferences',
    body: z.unknown(),
    responses: { 200: z.unknown(), 403: errorResponse, 500: errorResponse },
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
