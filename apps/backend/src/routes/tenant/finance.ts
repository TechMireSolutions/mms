import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { authenticateTenant } from '../../middleware/authenticate.js';
import { FINANCE_MODULE_CONTRACT, computeFinanceCommandMetrics } from '@mms/shared';
import { registerStandardTenantRoutes, registerMetricsRoute } from '../../lib/crudRouter.js';
import { invoiceRecordSchema, paymentRecordSchema } from '../../validation/financeSchemas.js';

import {
  loadInvoices,
  createInvoice,
  updateInvoiceById,
  deleteInvoiceById,
  restoreInvoiceById,
  loadPayments,
  createPayment,
  updatePaymentById,
  deletePaymentById,
  restorePaymentById,
} from '../../services/financeService.js';

const FINANCE_COLLECTION = FINANCE_MODULE_CONTRACT.collectionKey;
const PAYMENT_COLLECTION = FINANCE_MODULE_CONTRACT.paymentCollectionKey;

/**
 * Finance module routes — invoices, payments, metrics, and column preferences.
 */
export default async function financeRoutes(
  fastify: FastifyInstance,
  _options: FastifyPluginOptions,
): Promise<void> {
  fastify.addHook('preHandler', authenticateTenant);

  // --- Metrics ---
  registerMetricsRoute(fastify, {
    collection: FINANCE_COLLECTION,
    loadMetricsFn: async () => {
      const invoices = await loadInvoices();
      const payments = await loadPayments();
      return computeFinanceCommandMetrics(
        invoices as Array<{ status?: string }>,
        payments as Array<{ id?: string | number }>,
      );
    },
    errorMessagePrefix: 'finance',
  });

  // --- Invoices ---
  registerStandardTenantRoutes(fastify, {
    prefix: '/invoices',
    collection: FINANCE_COLLECTION,
    schema: invoiceRecordSchema,
    errorMessagePrefix: 'invoices',
    loadAllFn: loadInvoices,
    createFn: createInvoice,
    updateFn: updateInvoiceById,
    deleteFn: deleteInvoiceById,
    restoreFn: restoreInvoiceById,
    nameSingular: 'invoice',
    namePlural: 'invoices',
    columnPreferencesObjectKey: FINANCE_MODULE_CONTRACT.invoiceColumnPreferencesObjectKey,
  });

  // --- Payments ---
  registerStandardTenantRoutes(fastify, {
    prefix: '/payments',
    collection: PAYMENT_COLLECTION,
    schema: paymentRecordSchema,
    errorMessagePrefix: 'payments',
    loadAllFn: loadPayments,
    createFn: createPayment,
    updateFn: updatePaymentById,
    deleteFn: deletePaymentById,
    restoreFn: restorePaymentById,
    nameSingular: 'payment',
    namePlural: 'payments',
    columnPreferencesObjectKey: FINANCE_MODULE_CONTRACT.paymentColumnPreferencesObjectKey,
  });
}
