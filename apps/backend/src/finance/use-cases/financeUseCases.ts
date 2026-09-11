import type { FinanceRepository } from '../repository/financeRepository.js';
import { financeRepository } from '../repository/financeRepositoryAdapter.js';
import { getRequestTenant } from '../../lib/tenantContext.js';
import { invoiceRecordSchema, paymentRecordSchema } from '@mms/shared';
import { createGenericRelationalService } from '../../services/genericRelationalService.js';
import { runInTransaction } from '../../db/database.js';
import {
  dedupeTrimmedIds,
  getOutstandingAmountForInvoice,
  invoiceTotalsFromLines,
  normalizeFinanceReportComparisonQuery,
  resolveFamilyContactId,
  type FinanceCommandMetricsSnapshot,
  type FinanceListQuery,
  type FinanceReportComparisonQuery,
  type Invoice,
  type InvoiceCreateInput,
  type Payment,
  type PaymentCreateInput,
} from '@mms/shared';
import { allocateNextInvoiceNumber, replacePaymentAllocations } from '../../db/repositories/financeBillingRepository.js';
import { tryPostInvoiceJournal, tryPostPaymentJournal } from '../../accounting/ledgerPosting/ledgerPostingService.js';
import { loadFinanceModulePreferences } from '../../services/financePreferencesService.js';

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
      bulkDelete: repo.bulkSoftDeleteInvoices,
      bulkRestore: repo.bulkRestoreInvoices,
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
      bulkDelete: repo.bulkSoftDeletePayments,
      bulkRestore: repo.bulkRestorePayments,
    },
    schema: paymentRecordSchema,
    websocketCollection: 'finance_payments',
    idPrefix: 'pay',
  });

  return {
    // --- Invoices ---
    loadInvoices: invoiceCrud.loadAll,
    createInvoice: async (record: InvoiceCreateInput): Promise<Invoice> => {
      const tenant = getRequestTenant();
      if (!tenant) throw new Error('Tenant context required');
      const year = Number((record.dueDate ?? '').slice(0, 4)) || new Date().getFullYear();
      let prefix = 'INV';
      try {
        const prefs = await loadFinanceModulePreferences();
        prefix = prefs?.invoicePrefix?.trim() || 'INV';
      } catch {
        // Keep default prefix when preferences are unavailable.
      }
      const lines = (record.lines ?? []).map((line, index) => ({
        ...line,
        id: line.id ?? `il-${index + 1}`,
      }));
      const totals = lines.length > 0 ? invoiceTotalsFromLines(lines) : null;
      const { findStudentsByIds } = await import('../../db/repositories/studentRepository.js');
      const students = record.studentId ? await findStudentsByIds(tenant, [record.studentId]) : [];
      if (record.studentId && (!students[0] || students[0].deletedAt)) {
        const err = new Error('Referenced student is archived or does not exist');
        (err as Error & { statusCode: number }).statusCode = 400;
        throw err;
      }
      const created = await invoiceCrud.create({
        ...record,
        familyContactId: record.familyContactId ?? resolveFamilyContactId(students[0]),
        invoiceNumber: record.invoiceNumber || (await allocateNextInvoiceNumber(tenant, year, prefix)),
        ...(totals
          ? { baseFee: totals.baseFee, discountAmt: totals.discountAmt, finalAmt: totals.finalAmt }
          : {}),
        ...(lines.length > 0 ? { lines } : {}),
      } as Invoice);
      await tryPostInvoiceJournal(tenant, created);
      return created;
    },
    updateInvoiceById: async (id: string, record: Invoice): Promise<Invoice | null> => {
      const tenant = getRequestTenant();
      if (!tenant) throw new Error('Tenant context required');
      if (record.studentId) {
        const { findStudentsByIds } = await import('../../db/repositories/studentRepository.js');
        const students = await findStudentsByIds(tenant, [record.studentId]);
        if (!students[0] || students[0].deletedAt) {
          const err = new Error('Referenced student is archived or does not exist');
          (err as Error & { statusCode: number }).statusCode = 400;
          throw err;
        }
      }
      return invoiceCrud.updateById(id, record);
    },
    deleteInvoiceById: invoiceCrud.deleteById,
    restoreInvoiceById: invoiceCrud.restoreById,
    bulkSoftDeleteInvoices: invoiceCrud.bulkDeleteByIds,
    bulkRestoreInvoices: invoiceCrud.bulkRestoreByIds,

    getInvoiceById: async (id: string, includeDeleted = false): Promise<Invoice | null> => {
      const tenant = getRequestTenant();
      if (!tenant) return null;
      const cleanId = id?.trim();
      if (!cleanId) return null;
      const invoice = await repo.findInvoiceById(tenant, cleanId);
      if (!invoice) return null;
      if (!includeDeleted && invoice.deletedAt) return null;
      return invoice;
    },

    getInvoicesByIds: async (ids: string[], includeDeleted = false): Promise<Invoice[]> => {
      const tenant = getRequestTenant();
      if (!tenant) return [];
      const cleanIds = dedupeTrimmedIds(ids);
      if (cleanIds.length === 0) return [];
      return repo.findInvoicesByIds(tenant, cleanIds, { includeDeleted });
    },

    bulkUpdateInvoicesStatus: async (
      ids: string[],
      status: string,
    ): Promise<{ succeeded: number; failed: number }> => {
      const tenant = getRequestTenant();
      const cleanIds = dedupeTrimmedIds(ids);
      if (!tenant) return { succeeded: 0, failed: cleanIds.length };
      if (cleanIds.length === 0) return { succeeded: 0, failed: 0 };
      const result = await repo.bulkUpdateInvoicesStatus(tenant, cleanIds, status);
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

    getPaymentById: async (id: string, includeDeleted = false): Promise<Payment | null> => {
      const tenant = getRequestTenant();
      if (!tenant) return null;
      const cleanId = id?.trim();
      if (!cleanId) return null;
      const payment = await repo.findPaymentById(tenant, cleanId);
      if (!payment) return null;
      if (!includeDeleted && payment.deletedAt) return null;
      return payment;
    },

    getPaymentsByIds: async (ids: string[], includeDeleted = false): Promise<Payment[]> => {
      const tenant = getRequestTenant();
      if (!tenant) return [];
      const cleanIds = dedupeTrimmedIds(ids);
      if (cleanIds.length === 0) return [];
      return repo.findPaymentsByIds(tenant, cleanIds, { includeDeleted });
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
        if (!invoice || invoice.deletedAt) {
          const err = new Error('Referenced invoice is archived or does not exist');
          (err as Error & { statusCode: number }).statusCode = 400;
          throw err;
        }

        const paidAmount = invoice.paidAmt ?? 0;
        const remainingBalance = getOutstandingAmountForInvoice(invoice);
        if (normalizedPayment.amount > remainingBalance) {
          throw new Error('Payment amount exceeds the remaining invoice balance');
        }

        const newPaid = paidAmount + normalizedPayment.amount;
        await repo.saveInvoice(tenant, {
          ...invoice,
          status: remainingBalance - normalizedPayment.amount <= 0 ? 'paid' : 'partial',
          paidAmt: newPaid,
          paidDate: normalizedPayment.date,
          method: normalizedPayment.method,
        });
        await repo.savePayment(tenant, normalizedPayment);
        return normalizedPayment;
      });

      const allocations = (record.allocations ?? []).map((allocation, index) => ({
        ...allocation,
        id: allocation.id ?? `alloc-${index + 1}`,
      }));
      await replacePaymentAllocations(
        tenant,
        savedPayment.id,
        allocations.length > 0
          ? allocations
          : [{ id: `alloc-${savedPayment.id}`, invoiceId: savedPayment.invoiceId, amount: savedPayment.amount }],
      );
      await tryPostPaymentJournal(tenant, savedPayment);

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
