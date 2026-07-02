import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { authenticateTenant } from '../../middleware/authenticate.js';
import { canReadCollection, canWriteCollection } from '../../services/rbacService.js';
import type { User } from '@mms/shared';
import { FINANCE_MODULE_CONTRACT } from '@mms/shared';
import { sendForbidden } from '../../lib/httpErrors.js';
import { moduleColumnPreferencesBodySchema } from '../../validation/moduleColumnPreferencesSchemas.js';
import { parseRequest, replyValidationError } from '../../lib/zodRequest.js';
import { resourceIdParamsSchema } from '../../validation/commonSchemas.js';
import {
  getUserColumnPreferencesForModule,
  setUserColumnPreferencesForModule,
} from '../../services/userColumnPreferencesService.js';
import { loadFinanceCommandMetrics } from '../../services/financeMetricsService.js';
import {
  loadInvoices,
  createInvoice,
  updateInvoiceById,
  deleteInvoiceById,
  loadPayments,
  createPayment,
  updatePaymentById,
  deletePaymentById,
} from '../../services/financeService.js';
import { invoiceRecordSchema, paymentRecordSchema } from '../../validation/financeSchemas.js';

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
  fastify.get('/metrics', async (request, reply) => {
    const user = request.user as User;
    if (!canReadCollection(user, FINANCE_COLLECTION)) return sendForbidden(reply);
    try {
      return reply.send({ metrics: await loadFinanceCommandMetrics() });
    } catch {
      return reply.status(500).send({ type: 'database_error', message: 'Failed to load finance metrics' });
    }
  });

  // --- Invoices ---
  fastify.get('/invoices', async (request, reply) => {
    const user = request.user as User;
    if (!canReadCollection(user, FINANCE_COLLECTION)) return sendForbidden(reply);
    try {
      return reply.send({ invoices: await loadInvoices() });
    } catch {
      return reply.status(500).send({ type: 'database_error', message: 'Failed to list invoices' });
    }
  });

  fastify.post('/invoices', async (request, reply) => {
    const user = request.user as User;
    if (!canWriteCollection(user, FINANCE_COLLECTION)) return sendForbidden(reply);
    const parsed = parseRequest(invoiceRecordSchema, request.body);
    if (!parsed.ok) return replyValidationError(reply, parsed.message);
    try {
      const invoice = await createInvoice(parsed.data);
      return reply.status(201).send({ invoice });
    } catch {
      return reply.status(500).send({ type: 'database_error', message: 'Failed to create invoice' });
    }
  });

  fastify.put('/invoices/:id', async (request, reply) => {
    const user = request.user as User;
    if (!canWriteCollection(user, FINANCE_COLLECTION)) return sendForbidden(reply);
    const params = parseRequest(resourceIdParamsSchema, request.params);
    const body = parseRequest(invoiceRecordSchema, request.body);
    if (!params.ok) return replyValidationError(reply, params.message);
    if (!body.ok) return replyValidationError(reply, body.message);
    try {
      const updated = await updateInvoiceById(params.data.id, {
        ...body.data,
        id: body.data.id ?? params.data.id,
      });
      if (!updated) {
        return reply.status(404).send({ type: 'not_found', message: 'Invoice not found' });
      }
      return reply.send({ invoice: updated });
    } catch {
      return reply.status(500).send({ type: 'database_error', message: 'Failed to update invoice' });
    }
  });

  fastify.delete('/invoices/:id', async (request, reply) => {
    const user = request.user as User;
    if (!canWriteCollection(user, FINANCE_COLLECTION)) return sendForbidden(reply);
    const params = parseRequest(resourceIdParamsSchema, request.params);
    if (!params.ok) return replyValidationError(reply, params.message);
    try {
      const deleted = await deleteInvoiceById(params.data.id);
      if (!deleted) {
        return reply.status(404).send({ type: 'not_found', message: 'Invoice not found' });
      }
      return reply.send({ success: true });
    } catch {
      return reply.status(500).send({ type: 'database_error', message: 'Failed to delete invoice' });
    }
  });

  // --- Payments ---
  fastify.get('/payments', async (request, reply) => {
    const user = request.user as User;
    if (!canReadCollection(user, PAYMENT_COLLECTION)) return sendForbidden(reply);
    try {
      return reply.send({ payments: await loadPayments() });
    } catch {
      return reply.status(500).send({ type: 'database_error', message: 'Failed to list payments' });
    }
  });

  fastify.post('/payments', async (request, reply) => {
    const user = request.user as User;
    if (!canWriteCollection(user, PAYMENT_COLLECTION)) return sendForbidden(reply);
    const parsed = parseRequest(paymentRecordSchema, request.body);
    if (!parsed.ok) return replyValidationError(reply, parsed.message);
    try {
      const payment = await createPayment(parsed.data);
      return reply.status(201).send({ payment });
    } catch {
      return reply.status(500).send({ type: 'database_error', message: 'Failed to record payment' });
    }
  });

  fastify.put('/payments/:id', async (request, reply) => {
    const user = request.user as User;
    if (!canWriteCollection(user, PAYMENT_COLLECTION)) return sendForbidden(reply);
    const params = parseRequest(resourceIdParamsSchema, request.params);
    const body = parseRequest(paymentRecordSchema, request.body);
    if (!params.ok) return replyValidationError(reply, params.message);
    if (!body.ok) return replyValidationError(reply, body.message);
    try {
      const updated = await updatePaymentById(params.data.id, {
        ...body.data,
        id: body.data.id ?? params.data.id,
      });
      if (!updated) {
        return reply.status(404).send({ type: 'not_found', message: 'Payment not found' });
      }
      return reply.send({ payment: updated });
    } catch {
      return reply.status(500).send({ type: 'database_error', message: 'Failed to update payment' });
    }
  });

  fastify.delete('/payments/:id', async (request, reply) => {
    const user = request.user as User;
    if (!canWriteCollection(user, PAYMENT_COLLECTION)) return sendForbidden(reply);
    const params = parseRequest(resourceIdParamsSchema, request.params);
    if (!params.ok) return replyValidationError(reply, params.message);
    try {
      const deleted = await deletePaymentById(params.data.id);
      if (!deleted) {
        return reply.status(404).send({ type: 'not_found', message: 'Payment not found' });
      }
      return reply.send({ success: true });
    } catch {
      return reply.status(500).send({ type: 'database_error', message: 'Failed to delete payment' });
    }
  });

  // --- Column Preferences ---
  fastify.get('/invoices/column-preferences', async (request, reply) => {
    const user = request.user as User;
    if (!canReadCollection(user, FINANCE_COLLECTION)) return sendForbidden(reply);
    try {
      const preferences = await getUserColumnPreferencesForModule(
        FINANCE_MODULE_CONTRACT.invoiceColumnPreferencesObjectKey,
        String(user.id),
      );
      return reply.send({ preferences });
    } catch {
      return reply.status(500).send({ type: 'database_error', message: 'Failed to load column preferences' });
    }
  });

  fastify.put('/invoices/column-preferences', async (request, reply) => {
    const user = request.user as User;
    if (!canReadCollection(user, FINANCE_COLLECTION)) return sendForbidden(reply);
    const parsed = parseRequest(moduleColumnPreferencesBodySchema, request.body);
    if (!parsed.ok) return replyValidationError(reply, parsed.message);
    try {
      await setUserColumnPreferencesForModule(
        FINANCE_MODULE_CONTRACT.invoiceColumnPreferencesObjectKey,
        String(user.id),
        parsed.data.preferences,
      );
      return reply.send({ success: true, preferences: parsed.data.preferences });
    } catch {
      return reply.status(500).send({ type: 'database_error', message: 'Failed to save column preferences' });
    }
  });

  fastify.get('/payments/column-preferences', async (request, reply) => {
    const user = request.user as User;
    if (!canReadCollection(user, PAYMENT_COLLECTION)) return sendForbidden(reply);
    try {
      const preferences = await getUserColumnPreferencesForModule(
        FINANCE_MODULE_CONTRACT.paymentColumnPreferencesObjectKey,
        String(user.id),
      );
      return reply.send({ preferences });
    } catch {
      return reply.status(500).send({ type: 'database_error', message: 'Failed to load column preferences' });
    }
  });

  fastify.put('/payments/column-preferences', async (request, reply) => {
    const user = request.user as User;
    if (!canReadCollection(user, PAYMENT_COLLECTION)) return sendForbidden(reply);
    const parsed = parseRequest(moduleColumnPreferencesBodySchema, request.body);
    if (!parsed.ok) return replyValidationError(reply, parsed.message);
    try {
      await setUserColumnPreferencesForModule(
        FINANCE_MODULE_CONTRACT.paymentColumnPreferencesObjectKey,
        String(user.id),
        parsed.data.preferences,
      );
      return reply.send({ success: true, preferences: parsed.data.preferences });
    } catch {
      return reply.status(500).send({ type: 'database_error', message: 'Failed to save column preferences' });
    }
  });
}

