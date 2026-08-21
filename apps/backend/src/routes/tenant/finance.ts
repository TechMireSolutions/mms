import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { authenticateTenant } from '../../middleware/authenticate.js';
import { requireTenantModule } from '../../middleware/requireTenantModule.js';
import { FINANCE_MODULE_MANIFEST, type User } from '@mms/shared';
import { registerStandardTenantRoutes, registerMetricsRoute } from '../../lib/crudRouter.js';
import {
  financeBulkIdsSchema,
  financeListQuerySchema,
  invoiceCreateBodySchema,
  invoiceRecordSchema,
  invoicesBulkStatusSchema,
  paymentCreateBodySchema,
  paymentRecordSchema,
} from '../../validation/financeSchemas.js';

import {
  loadInvoices,
  loadInvoicesPage,
  createInvoice,
  updateInvoiceById,
  deleteInvoiceById,
  restoreInvoiceById,
  bulkSoftDeleteInvoices,
  bulkRestoreInvoices,
  bulkUpdateInvoicesStatus,
  loadPayments,
  loadPaymentsPage,
  createPayment,
  updatePaymentById,
  deletePaymentById,
  restorePaymentById,
  bulkSoftDeletePayments,
  bulkRestorePayments,
  loadFinanceCommandMetrics,
} from '../../services/financeService.js';
import { canDeleteCollection, canWriteCollection } from '../../services/rbacService.js';
import { sendDatabaseError, sendForbidden } from '../../lib/httpErrors.js';
import { parseRequest, replyValidationError } from '../../lib/zodRequest.js';
import { financeReportRoutes } from './finance/financeReportRoutes.js';
import { financeSetupConfigRoutes } from './finance/financeSetupConfigRoutes.js';

const FINANCE_COLLECTION = FINANCE_MODULE_MANIFEST.collectionKey;
const PAYMENT_COLLECTION = FINANCE_MODULE_MANIFEST.paymentCollectionKey;

/**
 * Finance module routes — invoices, payments, metrics, and column preferences.
 */
export default async function financeRoutes(
  fastify: FastifyInstance,
  _options: FastifyPluginOptions,
): Promise<void> {
  fastify.addHook('preHandler', authenticateTenant);
  fastify.addHook('preHandler', requireTenantModule('finance'));

  await fastify.register(financeReportRoutes);
  await fastify.register(financeSetupConfigRoutes);

  // --- Metrics ---
  registerMetricsRoute(fastify, {
    collection: FINANCE_COLLECTION,
    loadMetricsFn: loadFinanceCommandMetrics,
    errorMessagePrefix: 'finance',
  });

  // --- Invoices ---
  registerStandardTenantRoutes(fastify, {
    prefix: '/invoices',
    collection: FINANCE_COLLECTION,
    schema: invoiceRecordSchema,
    listQuerySchema: financeListQuerySchema,
    defaultPageSize: FINANCE_MODULE_MANIFEST.defaultPageSize,
    errorMessagePrefix: 'invoices',
    loadAllFn: loadInvoices,
    loadPageFn: loadInvoicesPage,
    createFn: createInvoice,
    updateFn: updateInvoiceById,
    deleteFn: deleteInvoiceById,
    restoreFn: restoreInvoiceById,
    nameSingular: 'invoice',
    namePlural: 'invoices',
    columnPreferencesObjectKey: FINANCE_MODULE_MANIFEST.invoiceColumnPreferencesObjectKey,
    customPostRoute: true,
  });

  fastify.post('/invoices', async (request, reply) => {
    const user = request.user as User;
    if (!canWriteCollection(user, FINANCE_COLLECTION)) return sendForbidden(reply);
    const parsed = parseRequest(invoiceCreateBodySchema, request.body);
    if (!parsed.ok) return replyValidationError(reply, parsed.message);
    try {
      return reply.status(201).send({ invoice: await createInvoice(parsed.data) });
    } catch (error: unknown) {
      return sendDatabaseError(reply, 'Failed to create invoice', error);
    }
  });

  // --- Payments ---
  registerStandardTenantRoutes(fastify, {
    prefix: '/payments',
    collection: PAYMENT_COLLECTION,
    schema: paymentRecordSchema,
    listQuerySchema: financeListQuerySchema,
    defaultPageSize: FINANCE_MODULE_MANIFEST.defaultPageSize,
    errorMessagePrefix: 'payments',
    loadAllFn: loadPayments,
    loadPageFn: loadPaymentsPage,
    createFn: createPayment,
    updateFn: updatePaymentById,
    deleteFn: deletePaymentById,
    restoreFn: restorePaymentById,
    nameSingular: 'payment',
    namePlural: 'payments',
    columnPreferencesObjectKey: FINANCE_MODULE_MANIFEST.paymentColumnPreferencesObjectKey,
    customPostRoute: true,
  });

  fastify.post('/payments', async (request, reply) => {
    const user = request.user as User;
    if (!canWriteCollection(user, PAYMENT_COLLECTION)) return sendForbidden(reply);
    const parsed = parseRequest(paymentCreateBodySchema, request.body);
    if (!parsed.ok) return replyValidationError(reply, parsed.message);
    try {
      return reply.status(201).send({ payment: await createPayment(parsed.data) });
    } catch (error: unknown) {
      return sendDatabaseError(reply, 'Failed to create payment', error);
    }
  });

  const registerBulkTrashRoutes = (
    prefix: '/invoices' | '/payments',
    collection: string,
    bulkDelete: typeof bulkSoftDeleteInvoices,
    bulkRestore: typeof bulkRestoreInvoices,
  ) => {
    fastify.post(`${prefix}/bulk-delete`, async (request, reply) => {
      const user = request.user as User;
      if (!canDeleteCollection(user, collection)) return sendForbidden(reply);
      const parsed = parseRequest(financeBulkIdsSchema, request.body);
      if (!parsed.ok) return replyValidationError(reply, parsed.message);
      try {
        return reply.send({
          success: true,
          ...await bulkDelete(parsed.data.ids.map(String), String(user.id)),
        });
      } catch {
        return sendDatabaseError(reply, `Failed to bulk delete ${prefix.slice(1)}`);
      }
    });

    fastify.post(`${prefix}/bulk-restore`, async (request, reply) => {
      const user = request.user as User;
      if (!canDeleteCollection(user, collection)) return sendForbidden(reply);
      const parsed = parseRequest(financeBulkIdsSchema, request.body);
      if (!parsed.ok) return replyValidationError(reply, parsed.message);
      try {
        return reply.send({
          success: true,
          ...await bulkRestore(parsed.data.ids.map(String)),
        });
      } catch {
        return sendDatabaseError(reply, `Failed to bulk restore ${prefix.slice(1)}`);
      }
    });
  };

  registerBulkTrashRoutes('/invoices', FINANCE_COLLECTION, bulkSoftDeleteInvoices, bulkRestoreInvoices);
  registerBulkTrashRoutes('/payments', PAYMENT_COLLECTION, bulkSoftDeletePayments, bulkRestorePayments);

  fastify.post('/invoices/bulk-status', async (request, reply) => {
    const user = request.user as User;
    if (!canWriteCollection(user, FINANCE_COLLECTION)) return sendForbidden(reply);
    const parsed = parseRequest(invoicesBulkStatusSchema, request.body);
    if (!parsed.ok) return replyValidationError(reply, parsed.message);
    try {
      const result = await bulkUpdateInvoicesStatus(parsed.data.ids, parsed.data.status);
      return reply.send({ success: true, ...result });
    } catch {
      return sendDatabaseError(reply, 'Failed to bulk update invoice status');
    }
  });
}
