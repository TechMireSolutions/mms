import { initContract } from '@ts-rest/core';
import { z } from 'zod';
import { baseListQuerySchema } from '../apiSchemas.js';
import { invoiceCreateSchema, paymentCreateSchema } from '../schemas/finance.dto.js';
import { invoiceRecordUpdateSchema, paymentRecordUpdateSchema, invoicesBulkStatusSchema } from '../financeModuleManifest.js';
import { financeReportAggregatesSchema } from '../financeReportAggregates.js';
import { reportComparisonQuerySchema } from '../reportComparisonQuery.js';
import { financeFieldConfigPutBodySchema, financePreferencesPutBodySchema } from '../financeSetupConfigTypes.js';

const c = initContract();

const errorResponse = z.unknown();

export const financeContract = c.router({
  getInvoice: {
    method: 'GET',
    path: '/api/finance/invoices/:id',
    responses: { 200: z.unknown(), 403: errorResponse, 404: errorResponse, 500: errorResponse },
    summary: 'Get a single invoice',
  },
  listInvoices: {
    method: 'GET',
    path: '/api/finance/invoices',
    query: baseListQuerySchema,
    responses: { 200: z.unknown(), 403: errorResponse, 500: errorResponse },
    summary: 'List invoices',
  },
  createInvoice: {
    method: 'POST',
    path: '/api/finance/invoices',
    body: invoiceCreateSchema,
    responses: { 200: z.unknown(), 201: z.unknown(), 400: errorResponse, 403: errorResponse, 500: errorResponse },
    summary: 'Create a new invoice',
  },
  updateInvoice: {
    method: 'PUT',
    path: '/api/finance/invoices/:id',
    body: invoiceRecordUpdateSchema,
    responses: { 200: z.unknown(), 400: errorResponse, 403: errorResponse, 404: errorResponse, 500: errorResponse },
    summary: 'Update an invoice',
  },
  deleteInvoice: {
    method: 'DELETE',
    path: '/api/finance/invoices/:id',
    body: z.object({ deletionReason: z.string().optional() }).optional(),
    responses: { 200: z.unknown(), 403: errorResponse, 404: errorResponse, 500: errorResponse },
    summary: 'Delete an invoice',
  },
  getPayment: {
    method: 'GET',
    path: '/api/finance/payments/:id',
    responses: { 200: z.unknown(), 403: errorResponse, 404: errorResponse, 500: errorResponse },
    summary: 'Get a single payment',
  },
  listPayments: {
    method: 'GET',
    path: '/api/finance/payments',
    query: baseListQuerySchema,
    responses: { 200: z.unknown(), 403: errorResponse, 500: errorResponse },
    summary: 'List payments',
  },
  createPayment: {
    method: 'POST',
    path: '/api/finance/payments',
    body: paymentCreateSchema,
    responses: { 200: z.unknown(), 201: z.unknown(), 400: errorResponse, 403: errorResponse, 500: errorResponse },
    summary: 'Create a new payment',
  },
  updatePayment: {
    method: 'PUT',
    path: '/api/finance/payments/:id',
    body: paymentRecordUpdateSchema,
    responses: { 200: z.unknown(), 400: errorResponse, 403: errorResponse, 404: errorResponse, 500: errorResponse },
    summary: 'Update a payment',
  },
  deletePayment: {
    method: 'DELETE',
    path: '/api/finance/payments/:id',
    body: z.object({ deletionReason: z.string().optional() }).optional(),
    responses: { 200: z.unknown(), 403: errorResponse, 404: errorResponse, 500: errorResponse },
    summary: 'Delete a payment',
  },
  bulkDeleteInvoices: {
    method: 'POST',
    path: '/api/finance/invoices/bulk-delete',
    body: z.object({ ids: z.array(z.union([z.string(), z.number()])).min(1) }),
    responses: { 200: z.unknown(), 400: errorResponse, 403: errorResponse, 500: errorResponse },
    summary: 'Bulk soft-delete invoices',
  },
  bulkRestoreInvoices: {
    method: 'POST',
    path: '/api/finance/invoices/bulk-restore',
    body: z.object({ ids: z.array(z.union([z.string(), z.number()])).min(1) }),
    responses: { 200: z.unknown(), 400: errorResponse, 403: errorResponse, 500: errorResponse },
    summary: 'Bulk restore invoices',
  },
  bulkStatusInvoices: {
    method: 'POST',
    path: '/api/finance/invoices/bulk-status',
    body: invoicesBulkStatusSchema,
    responses: { 200: z.unknown(), 400: errorResponse, 403: errorResponse, 500: errorResponse },
    summary: 'Bulk update invoice status',
  },
  bulkDeletePayments: {
    method: 'POST',
    path: '/api/finance/payments/bulk-delete',
    body: z.object({ ids: z.array(z.union([z.string(), z.number()])).min(1) }),
    responses: { 200: z.unknown(), 400: errorResponse, 403: errorResponse, 500: errorResponse },
    summary: 'Bulk soft-delete payments',
  },
  bulkRestorePayments: {
    method: 'POST',
    path: '/api/finance/payments/bulk-restore',
    body: z.object({ ids: z.array(z.union([z.string(), z.number()])).min(1) }),
    responses: { 200: z.unknown(), 400: errorResponse, 403: errorResponse, 500: errorResponse },
    summary: 'Bulk restore payments',
  },
  restoreInvoice: {
    method: 'POST',
    path: '/api/finance/invoices/:id/restore',
    body: z.object({}),
    responses: { 200: z.unknown(), 403: errorResponse, 404: errorResponse, 500: errorResponse },
    summary: 'Restore a soft-deleted invoice',
  },
  restorePayment: {
    method: 'POST',
    path: '/api/finance/payments/:id/restore',
    body: z.object({}),
    responses: { 200: z.unknown(), 403: errorResponse, 404: errorResponse, 500: errorResponse },
    summary: 'Restore a soft-deleted payment',
  },
  getMetrics: {
    method: 'GET',
    path: '/api/finance/metrics',
    responses: { 200: z.unknown(), 403: errorResponse, 500: errorResponse },
    summary: 'Get finance command metrics',
  },
  widgetAggregates: {
    method: 'POST',
    path: '/api/finance/widget-aggregates',
    body: z.object({ widgets: z.array(z.unknown()) }),
    responses: { 200: z.unknown(), 403: errorResponse, 500: errorResponse },
    summary: 'Get widget aggregates',
  },
  getFieldConfig: {
    method: 'GET',
    path: '/api/finance/field-config',
    responses: { 200: z.object({ config: z.unknown().nullable() }), 403: errorResponse, 500: errorResponse },
    summary: 'Get finance field config',
  },
  updateFieldConfig: {
    method: 'PUT',
    path: '/api/finance/field-config',
    body: financeFieldConfigPutBodySchema,
    responses: { 200: z.object({ success: z.boolean(), config: z.unknown() }), 400: errorResponse, 403: errorResponse, 500: errorResponse },
    summary: 'Update finance field config',
  },
  getPreferences: {
    method: 'GET',
    path: '/api/finance/preferences',
    responses: { 200: z.object({ preferences: z.unknown().nullable() }), 403: errorResponse, 500: errorResponse },
    summary: 'Get finance preferences',
  },
  updatePreferences: {
    method: 'PUT',
    path: '/api/finance/preferences',
    body: financePreferencesPutBodySchema,
    responses: { 200: z.object({ success: z.boolean(), preferences: z.unknown() }), 400: errorResponse, 403: errorResponse, 500: errorResponse },
    summary: 'Update finance preferences',
  },
  getReportAggregates: {
    method: 'GET',
    path: '/api/finance/report-aggregates',
    query: reportComparisonQuerySchema.optional(),
    responses: { 200: financeReportAggregatesSchema, 403: errorResponse, 500: errorResponse },
    summary: 'Get finance report aggregates',
  },
});
