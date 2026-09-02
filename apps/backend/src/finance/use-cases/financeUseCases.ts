import type { FinanceRepository } from '../repository/financeRepository.js';
import { financeRepository } from '../repository/financeRepositoryAdapter.js';
import { getRequestTenant } from '../../lib/tenantContext.js';
import { invoiceRecordSchema, paymentRecordSchema } from '../../validation/financeSchemas.js';
import { createGenericRelationalService } from '../../services/genericRelationalService.js';
import { runInTransaction } from '../../db/database.js';
import {
  normalizeFinanceReportComparisonQuery,
  type FinanceCommandMetricsSnapshot,
  type FinanceListQuery,
  type FinanceReportComparisonQuery,
  type Invoice,
  type InvoiceCreateInput,
  type Payment,
  type PaymentCreateInput,
} from '@mms/shared';

const EMPTY_FINANCE_METRICS: FinanceCommandMetricsSnapshot = {
  totalInvoices: 0,
  outstanding: 0,
  overdue: 0,
  paid: 0,
  partial: 0,
  totalPayments: 0,
  collectedTotal: 0,
  outstandingBalance: 0,
  discountTotal: 0,
  collectedThisMonth: 0,
  collectedPrevMonth: 0,
  outstandingThisMonth: 0,
  outstandingPrevMonth: 0,
};

/**
 * Finance use-cases — composition root binding a {@link FinanceRepository} to
 * every operation. Production uses the default Drizzle-backed `financeUseCases`;
 * tests can pass a fake repository to exercise orchestration in isolation.
 */
export function createFinanceUseCases(repo: FinanceRepository = financeRepository) {
  const invoiceCrud = createGenericRelationalService<Invoice>({
    repo: {
      listByWorkspace: repo.listInvoicesByWorkspace,
      findById: repo.findInvoiceById,
      save: repo.saveInvoice,
    },
    schema: invoiceRecordSchema,
    websocketCollection: 'finance_invoices',
    idPrefix: 'inv',
  });

  const paymentCrud = createGenericRelationalService<Payment>({
    repo: {
      listByWorkspace: repo.listPaymentsByWorkspace,
      findById: repo.findPaymentById,
      save: repo.savePayment,
    },
    schema: paymentRecordSchema,
    websocketCollection: 'finance_payments',
    idPrefix: 'pay',
  });

  return {
    // --- Invoices ---
    loadInvoices: invoiceCrud.loadAll,
    createInvoice: (record: InvoiceCreateInput): Promise<Invoice> =>
      invoiceCrud.create(record as Invoice),
    updateInvoiceById: invoiceCrud.updateById,
    deleteInvoiceById: invoiceCrud.deleteById,
    restoreInvoiceById: invoiceCrud.restoreById,
    bulkSoftDeleteInvoices: invoiceCrud.bulkDeleteByIds,
    bulkRestoreInvoices: invoiceCrud.bulkRestoreByIds,

    getInvoiceById: async (id: string): Promise<Invoice | null> => {
      const tenant = getRequestTenant();
      if (!tenant) return null;
      return repo.findInvoiceById(tenant, id);
    },

    bulkUpdateInvoicesStatus: async (
      ids: string[],
      status: string,
    ): Promise<{ succeeded: number; failed: number }> => {
      const tenant = getRequestTenant();
      if (!tenant) return { succeeded: 0, failed: ids.length };
      const result = await repo.bulkUpdateInvoicesStatus(tenant, ids, status);
      const { broadcastTenantUpdate } = await import('../../services/websocketService.js');
      broadcastTenantUpdate(tenant, 'collection', 'finance_invoices');
      broadcastTenantUpdate(tenant, 'collection', 'finance_metrics');
      return result;
    },

    loadInvoicesPage: async (query: FinanceListQuery & { includeDeleted?: boolean }) => {
      const tenant = getRequestTenant();
      if (!tenant) {
        return {
          invoices: [],
          total: 0,
          page: query.page ?? 1,
          limit: query.limit ?? 12,
          hasMore: false,
        };
      }
      return repo.listInvoicesPage(tenant, query);
    },

    // --- Payments ---
    loadPayments: paymentCrud.loadAll,
    updatePaymentById: paymentCrud.updateById,
    deletePaymentById: paymentCrud.deleteById,
    restorePaymentById: paymentCrud.restoreById,
    bulkSoftDeletePayments: paymentCrud.bulkDeleteByIds,
    bulkRestorePayments: paymentCrud.bulkRestoreByIds,

    getPaymentById: async (id: string): Promise<Payment | null> => {
      const tenant = getRequestTenant();
      if (!tenant) return null;
      return repo.findPaymentById(tenant, id);
    },

    loadPaymentsPage: async (query: FinanceListQuery & { includeDeleted?: boolean }) => {
      const tenant = getRequestTenant();
      if (!tenant) {
        return {
          payments: [],
          total: 0,
          page: query.page ?? 1,
          limit: query.limit ?? 12,
          hasMore: false,
        };
      }
      return repo.listPaymentsPage(tenant, query);
    },

    /**
     * Creates a payment and atomically updates the linked invoice's payment details.
     */
    createPayment: async (record: PaymentCreateInput): Promise<Payment> => {
      const tenant = getRequestTenant();
      if (!tenant) throw new Error('Tenant context required');
      const resolvedId = String(record.id ?? `pay-${Date.now()}`);
      const normalizedPayment = paymentRecordSchema.parse({ ...record, id: resolvedId }) as Payment;

      const savedPayment = await runInTransaction(async () => {
        const existingPayment = await repo.findPaymentById(tenant, resolvedId);
        if (existingPayment) return existingPayment;

        const invoice = await repo.findInvoiceById(tenant, normalizedPayment.invoiceId);
        if (!invoice || invoice.deletedAt) throw new Error('Invoice not found or deleted');

        const paidAmount = invoice.paidAmt ?? 0;
        const remainingBalance = Math.max(0, invoice.finalAmt - paidAmount);
        if (normalizedPayment.amount > remainingBalance) {
          throw new Error('Payment amount exceeds the remaining invoice balance');
        }

        const newPaid = paidAmount + normalizedPayment.amount;
        await repo.saveInvoice(tenant, {
          ...invoice,
          status: newPaid >= invoice.finalAmt ? 'paid' : 'partial',
          paidAmt: newPaid,
          paidDate: normalizedPayment.date,
          method: normalizedPayment.method,
        });
        await repo.savePayment(tenant, normalizedPayment);
        return normalizedPayment;
      });

      const { broadcastTenantUpdate } = await import('../../services/websocketService.js');
      broadcastTenantUpdate(tenant, 'collection', 'finance_invoices');
      broadcastTenantUpdate(tenant, 'collection', 'finance_payments');
      return savedPayment;
    },

    // --- Aggregates ---
    loadFinanceReportAggregates: async (comparisonQuery?: FinanceReportComparisonQuery) => {
      const tenant = getRequestTenant();
      if (!tenant) {
        return { comparison: { sessions: [], monthly: { a: [], b: [] } } };
      }
      const normalized = normalizeFinanceReportComparisonQuery(comparisonQuery);
      return repo.loadFinanceReportAggregates(tenant, normalized);
    },

    loadFinanceCommandMetrics: async (): Promise<FinanceCommandMetricsSnapshot> => {
      const tenant = getRequestTenant();
      if (!tenant) return EMPTY_FINANCE_METRICS;
      return repo.aggregateFinanceCommandMetrics(tenant);
    },

    loadFinanceWidgetAggregates: async (
      queries: import('@mms/shared').WidgetQuery[],
    ): Promise<Record<string, import('@mms/shared').WidgetAggregateResult>> => {
      const tenant = getRequestTenant();
      if (!tenant) return {};
      return repo.aggregateFinanceWidgetQueries(tenant, queries);
    },
  };
}

export const financeUseCases = createFinanceUseCases();
