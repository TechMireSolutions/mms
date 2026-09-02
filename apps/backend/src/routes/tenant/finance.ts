import { type FastifyInstance, type FastifyPluginOptions } from 'fastify';
import { authenticateTenant } from '../../middleware/authenticate.js';
import { requireTenantModule } from '../../middleware/requireTenantModule.js';
import { FINANCE_MODULE_MANIFEST, type User, type WidgetQuery, financeContract } from '@mms/shared';
import { registerStandardExtendedRoutes } from '../../lib/crudStandardRoutes.js';

import { financeUseCases } from '../../finance/use-cases/financeUseCases.js';
import { canDeleteCollection, canWriteCollection, canReadCollection } from '../../services/rbacService.js';
import { financeReportRoutes } from './finance/financeReportRoutes.js';
import { financeSetupConfigRoutes } from './finance/financeSetupConfigRoutes.js';
import { initServer } from '@ts-rest/fastify';
import type { ContractRouteArgs } from '../../lib/contractRouterTypes.js';
import { withTenant } from '../../db/tenant-context.js';

const FINANCE_COLLECTION = FINANCE_MODULE_MANIFEST.collectionKey;
const PAYMENT_COLLECTION = FINANCE_MODULE_MANIFEST.paymentCollectionKey;
const s = initServer();

/**
 * Finance module routes — invoices, payments, metrics, and column preferences.
 */
export default async function financeRoutes(
  fastify: FastifyInstance,
  _options: FastifyPluginOptions,
): Promise<void> {
  fastify.addHook('preHandler', authenticateTenant);
  fastify.addHook('preHandler', requireTenantModule('finance'));

  await fastify.register(financeReportRoutes, { prefix: '/api/finance' });
  await fastify.register(financeSetupConfigRoutes, { prefix: '/api/finance' });

  await fastify.register(
    async (sub) => {
      // --- Invoices Extended Routes (Column Preferences, etc) ---
      registerStandardExtendedRoutes(sub, {
        prefix: '/invoices',
        collection: FINANCE_COLLECTION,
        errorMessagePrefix: 'invoices',
        nameSingular: 'invoice',

      });

      sub.post<{ Params: { id: string } }>('/invoices/:id/restore', async (request, reply) => {
        const user = request.user as User;
        if (!canDeleteCollection(user, FINANCE_COLLECTION)) {
          return reply.status(403).send({ type: 'forbidden', message: 'Insufficient permissions' });
        }
        const { id } = request.params;
        try {
          const restored = await withTenant(String(request.tenant?.id), () => financeUseCases.restoreInvoiceById(id, String(user.id)), { readOnly: false });
          if (!restored) {
            return reply.status(404).send({ type: 'not_found', message: 'Invoice not found or not deleted' });
          }
          return reply.send({ success: true });
        } catch {
          return reply.status(500).send({ type: 'database_error', message: 'Failed to restore invoice' });
        }
      });

      // --- Payments Extended Routes (Column Preferences, etc) ---
      registerStandardExtendedRoutes(sub, {
        prefix: '/payments',
        collection: PAYMENT_COLLECTION,
        errorMessagePrefix: 'payments',
        nameSingular: 'payment',

      });

      sub.post<{ Params: { id: string } }>('/payments/:id/restore', async (request, reply) => {
        const user = request.user as User;
        if (!canDeleteCollection(user, PAYMENT_COLLECTION)) {
          return reply.status(403).send({ type: 'forbidden', message: 'Insufficient permissions' });
        }
        const { id } = request.params;
        try {
          const restored = await withTenant(String(request.tenant?.id), () => financeUseCases.restorePaymentById(id, String(user.id)), { readOnly: false });
          if (!restored) {
            return reply.status(404).send({ type: 'not_found', message: 'Payment not found or not deleted' });
          }
          return reply.send({ success: true });
        } catch {
          return reply.status(500).send({ type: 'database_error', message: 'Failed to restore payment' });
        }
      });
    },
    { prefix: '/api/finance' },
  );

  const router = s.router(financeContract, {
    listInvoices: async ({ query, request }: ContractRouteArgs<typeof financeContract['listInvoices']>): Promise<unknown> => {
      const user = request.user as User;
      if (!canReadCollection(user, FINANCE_COLLECTION)) return { status: 403 as const, body: { type: 'forbidden', message: 'Insufficient permissions' } };
      const includeDeleted = query?.includeDeleted === 'true' || query?.includeDeleted === true ? true : (query?.includeDeleted === 'false' || query?.includeDeleted === false ? false : undefined);
      if (includeDeleted && !canDeleteCollection(user, FINANCE_COLLECTION)) return { status: 403 as const, body: { type: 'forbidden', message: 'Insufficient permissions' } };
      try {
        const result = await withTenant(String(request.tenant?.id), () => financeUseCases.loadInvoicesPage({ ...query, ...(includeDeleted !== undefined ? { includeDeleted } : {}) } as Parameters<typeof financeUseCases.loadInvoicesPage>[0]), { readOnly: true });
        return { status: 200 as const, body: result };
      } catch (error) {
        return { status: 500 as const, body: { type: 'database_error', message: 'Failed to list invoices' } };
      }
    },
    getInvoice: async ({ params: { id }, request }: ContractRouteArgs<typeof financeContract['getInvoice']>): Promise<unknown> => {
      const user = request.user as User;
      if (!canReadCollection(user, FINANCE_COLLECTION)) return { status: 403 as const, body: { type: 'forbidden', message: 'Insufficient permissions' } };
      try {
        const item = await withTenant(String(request.tenant?.id), () => financeUseCases.getInvoiceById(id), { readOnly: true });
        if (!item) return { status: 404 as const, body: { type: 'not_found', message: 'Invoice not found' } };
        return { status: 200 as const, body: { invoice: item } };
      } catch (error) {
        return { status: 500 as const, body: { type: 'database_error', message: 'Failed to load invoice' } };
      }
    },
    createInvoice: async ({ body, request }: ContractRouteArgs<typeof financeContract['createInvoice']>): Promise<unknown> => {
      const user = request.user as User;
      if (!canWriteCollection(user, FINANCE_COLLECTION)) return { status: 403 as const, body: { type: 'forbidden', message: 'Insufficient permissions' } };
      try {
        const result = await withTenant(String(request.tenant?.id), () => financeUseCases.createInvoice(body), { readOnly: false });
        return { status: 201 as const, body: { invoice: result } };
      } catch (error) {
        return { status: 500 as const, body: { type: 'database_error', message: 'Failed to create invoice' } };
      }
    },
    updateInvoice: async ({ params: { id }, body, request }: ContractRouteArgs<typeof financeContract['updateInvoice']>): Promise<unknown> => {
      const user = request.user as User;
      if (!canWriteCollection(user, FINANCE_COLLECTION)) return { status: 403 as const, body: { type: 'forbidden', message: 'Insufficient permissions' } };
      try {
        const result = await withTenant(String(request.tenant?.id), () => financeUseCases.updateInvoiceById(id, body as Parameters<typeof financeUseCases.updateInvoiceById>[1]), { readOnly: false });
        if (!result) return { status: 404 as const, body: { type: 'not_found', message: 'Invoice not found' } };
        return { status: 200 as const, body: { invoice: result } };
      } catch (error) {
        return { status: 500 as const, body: { type: 'database_error', message: 'Failed to update invoice' } };
      }
    },
    deleteInvoice: async ({ params: { id }, body, request }: ContractRouteArgs<typeof financeContract['deleteInvoice']>): Promise<unknown> => {
      const user = request.user as User;
      if (!canDeleteCollection(user, FINANCE_COLLECTION)) return { status: 403 as const, body: { type: 'forbidden', message: 'Insufficient permissions' } };
      try {
        const deleted = await withTenant(String(request.tenant?.id), () => financeUseCases.deleteInvoiceById(id, String(user.id), body?.deletionReason), { readOnly: false });
        if (!deleted) return { status: 404 as const, body: { type: 'not_found', message: 'Invoice not found' } };
        return { status: 200 as const, body: { success: true } };
      } catch (error) {
        return { status: 500 as const, body: { type: 'database_error', message: 'Failed to delete invoice' } };
      }
    },
    listPayments: async ({ query, request }: ContractRouteArgs<typeof financeContract['listPayments']>): Promise<unknown> => {
      const user = request.user as User;
      if (!canReadCollection(user, PAYMENT_COLLECTION)) return { status: 403 as const, body: { type: 'forbidden', message: 'Insufficient permissions' } };
      const includeDeleted = query?.includeDeleted === 'true' || query?.includeDeleted === true ? true : (query?.includeDeleted === 'false' || query?.includeDeleted === false ? false : undefined);
      if (includeDeleted && !canDeleteCollection(user, PAYMENT_COLLECTION)) return { status: 403 as const, body: { type: 'forbidden', message: 'Insufficient permissions' } };
      try {
        const result = await withTenant(String(request.tenant?.id), () => financeUseCases.loadPaymentsPage({ ...query, ...(includeDeleted !== undefined ? { includeDeleted } : {}) } as Parameters<typeof financeUseCases.loadPaymentsPage>[0]), { readOnly: true });
        return { status: 200 as const, body: result };
      } catch (error) {
        return { status: 500 as const, body: { type: 'database_error', message: 'Failed to list payments' } };
      }
    },
    getPayment: async ({ params: { id }, request }: ContractRouteArgs<typeof financeContract['getPayment']>): Promise<unknown> => {
      const user = request.user as User;
      if (!canReadCollection(user, PAYMENT_COLLECTION)) return { status: 403 as const, body: { type: 'forbidden', message: 'Insufficient permissions' } };
      try {
        const item = await withTenant(String(request.tenant?.id), () => financeUseCases.getPaymentById(id), { readOnly: true });
        if (!item) return { status: 404 as const, body: { type: 'not_found', message: 'Payment not found' } };
        return { status: 200 as const, body: { payment: item } };
      } catch (error) {
        return { status: 500 as const, body: { type: 'database_error', message: 'Failed to load payment' } };
      }
    },
    createPayment: async ({ body, request }: ContractRouteArgs<typeof financeContract['createPayment']>): Promise<unknown> => {
      const user = request.user as User;
      if (!canWriteCollection(user, PAYMENT_COLLECTION)) return { status: 403 as const, body: { type: 'forbidden', message: 'Insufficient permissions' } };
      try {
        const result = await withTenant(String(request.tenant?.id), () => financeUseCases.createPayment(body), { readOnly: false });
        return { status: 201 as const, body: { payment: result } };
      } catch (error) {
        return { status: 500 as const, body: { type: 'database_error', message: 'Failed to create payment' } };
      }
    },
    updatePayment: async ({ params: { id }, body, request }: ContractRouteArgs<typeof financeContract['updatePayment']>): Promise<unknown> => {
      const user = request.user as User;
      if (!canWriteCollection(user, PAYMENT_COLLECTION)) return { status: 403 as const, body: { type: 'forbidden', message: 'Insufficient permissions' } };
      try {
        const result = await withTenant(String(request.tenant?.id), () => financeUseCases.updatePaymentById(id, body as Parameters<typeof financeUseCases.updatePaymentById>[1]), { readOnly: false });
        if (!result) return { status: 404 as const, body: { type: 'not_found', message: 'Payment not found' } };
        return { status: 200 as const, body: { payment: result } };
      } catch (error) {
        return { status: 500 as const, body: { type: 'database_error', message: 'Failed to update payment' } };
      }
    },
    deletePayment: async ({ params: { id }, body, request }: ContractRouteArgs<typeof financeContract['deletePayment']>): Promise<unknown> => {
      const user = request.user as User;
      if (!canDeleteCollection(user, PAYMENT_COLLECTION)) return { status: 403 as const, body: { type: 'forbidden', message: 'Insufficient permissions' } };
      try {
        const deleted = await withTenant(String(request.tenant?.id), () => financeUseCases.deletePaymentById(id, String(user.id), body?.deletionReason), { readOnly: false });
        if (!deleted) return { status: 404 as const, body: { type: 'not_found', message: 'Payment not found' } };
        return { status: 200 as const, body: { success: true } };
      } catch (error) {
        return { status: 500 as const, body: { type: 'database_error', message: 'Failed to delete payment' } };
      }
    },

    bulkDeleteInvoices: async ({ body, request }: ContractRouteArgs<typeof financeContract['bulkDeleteInvoices']>): Promise<unknown> => {
      const user = request.user as User;
      if (!canDeleteCollection(user, FINANCE_COLLECTION)) return { status: 403 as const, body: { type: 'forbidden', message: 'Insufficient permissions' } };
      try {
        const result = await withTenant(String(request.tenant?.id), () =>
          financeUseCases.bulkSoftDeleteInvoices(body.ids.map(String), String(user.id)), { readOnly: false });
        return { status: 200 as const, body: { success: true, ...result } };
      } catch {
        return { status: 500 as const, body: { type: 'database_error', message: 'Failed to bulk delete invoices' } };
      }
    },

    bulkRestoreInvoices: async ({ body, request }: ContractRouteArgs<typeof financeContract['bulkRestoreInvoices']>): Promise<unknown> => {
      const user = request.user as User;
      if (!canDeleteCollection(user, FINANCE_COLLECTION)) return { status: 403 as const, body: { type: 'forbidden', message: 'Insufficient permissions' } };
      try {
        const result = await withTenant(String(request.tenant?.id), () =>
          financeUseCases.bulkRestoreInvoices(body.ids.map(String)), { readOnly: false });
        return { status: 200 as const, body: { success: true, ...result } };
      } catch {
        return { status: 500 as const, body: { type: 'database_error', message: 'Failed to bulk restore invoices' } };
      }
    },

    bulkStatusInvoices: async ({ body, request }: ContractRouteArgs<typeof financeContract['bulkStatusInvoices']>): Promise<unknown> => {
      const user = request.user as User;
      if (!canWriteCollection(user, FINANCE_COLLECTION)) return { status: 403 as const, body: { type: 'forbidden', message: 'Insufficient permissions' } };
      try {
        const result = await withTenant(String(request.tenant?.id), () =>
          financeUseCases.bulkUpdateInvoicesStatus(body.ids, body.status), { readOnly: false });
        return { status: 200 as const, body: { success: true, ...result } };
      } catch {
        return { status: 500 as const, body: { type: 'database_error', message: 'Failed to bulk update invoice status' } };
      }
    },

    bulkDeletePayments: async ({ body, request }: ContractRouteArgs<typeof financeContract['bulkDeletePayments']>): Promise<unknown> => {
      const user = request.user as User;
      if (!canDeleteCollection(user, PAYMENT_COLLECTION)) return { status: 403 as const, body: { type: 'forbidden', message: 'Insufficient permissions' } };
      try {
        const result = await withTenant(String(request.tenant?.id), () =>
          financeUseCases.bulkSoftDeletePayments(body.ids.map(String), String(user.id)), { readOnly: false });
        return { status: 200 as const, body: { success: true, ...result } };
      } catch {
        return { status: 500 as const, body: { type: 'database_error', message: 'Failed to bulk delete payments' } };
      }
    },

    bulkRestorePayments: async ({ body, request }: ContractRouteArgs<typeof financeContract['bulkRestorePayments']>): Promise<unknown> => {
      const user = request.user as User;
      if (!canDeleteCollection(user, PAYMENT_COLLECTION)) return { status: 403 as const, body: { type: 'forbidden', message: 'Insufficient permissions' } };
      try {
        const result = await withTenant(String(request.tenant?.id), () =>
          financeUseCases.bulkRestorePayments(body.ids.map(String)), { readOnly: false });
        return { status: 200 as const, body: { success: true, ...result } };
      } catch {
        return { status: 500 as const, body: { type: 'database_error', message: 'Failed to bulk restore payments' } };
      }
    },

    getMetrics: async ({ request }: ContractRouteArgs<typeof financeContract['getMetrics']>): Promise<unknown> => {
      const user = request.user as User;
      if (!canReadCollection(user, FINANCE_COLLECTION)) return { status: 403 as const, body: { type: 'forbidden', message: 'Insufficient permissions' } };
      try {
        return { status: 200 as const, body: { metrics: await financeUseCases.loadFinanceCommandMetrics() } };
      } catch {
        return { status: 500 as const, body: { type: 'database_error', message: 'Failed to load finance metrics' } };
      }
    },
    widgetAggregates: async ({ body, request }: ContractRouteArgs<typeof financeContract['widgetAggregates']>): Promise<unknown> => {
      const user = request.user as User;
      if (!canReadCollection(user, FINANCE_COLLECTION)) return { status: 403 as const, body: { type: 'forbidden', message: 'Insufficient permissions' } };
      try {
        // (typed as WidgetQuery[] because the contract body is passthrough)
        const result = await withTenant(String(request.tenant?.id), () => financeUseCases.loadFinanceWidgetAggregates(body.widgets as WidgetQuery[]), { readOnly: true });
        return { status: 200 as const, body: result };
      } catch (error) {
        return { status: 500 as const, body: { type: 'database_error', message: 'Failed to load widget aggregates' } };
      }
    },
  } as unknown as Parameters<typeof s.router>[1]);

  await fastify.register(s.plugin(router));
}
