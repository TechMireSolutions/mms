import {
  paginateFinanceInvoices,
  paginateFinancePayments,
  normalizeFinanceReportComparisonQuery,
  type FinanceListQuery,
  type FinanceReportComparisonQuery,
  type Invoice,
  type InvoiceCreateInput,
  type Payment,
  type PaymentCreateInput,
} from '@mms/shared';
import { invoiceRecordSchema, paymentRecordSchema } from '../validation/financeSchemas.js';
import { getRequestTenant } from '../lib/tenantContext.js';
import {
  listInvoicesByWorkspace,
  findInvoiceById,
  saveInvoice,
  listPaymentsByWorkspace,
  findPaymentById,
  savePayment,
} from '../db/repositories/financeRepository.js';
import { loadFinanceReportAggregatesSql } from '../db/repositories/financeRepositoryReport.js';
import { createGenericRelationalService } from './genericRelationalService.js';
import { runInTransaction } from '../db/database.js';

// --- Invoices CRUD ---
const invoiceCrud = createGenericRelationalService<Invoice>({
  repo: {
    listByWorkspace: listInvoicesByWorkspace,
    findById: findInvoiceById,
    save: saveInvoice,
  },
  schema: invoiceRecordSchema,
  websocketCollection: 'finance_invoices',
  idPrefix: 'inv',
});

export const loadInvoices = invoiceCrud.loadAll;
export async function createInvoice(record: InvoiceCreateInput): Promise<Invoice> {
  return invoiceCrud.create(record as Invoice);
}
export const updateInvoiceById = invoiceCrud.updateById;
export const deleteInvoiceById = invoiceCrud.deleteById;
export const restoreInvoiceById = invoiceCrud.restoreById;
export const bulkSoftDeleteInvoices = invoiceCrud.bulkDeleteByIds;
export const bulkRestoreInvoices = invoiceCrud.bulkRestoreByIds;

export async function loadInvoicesPage(query: FinanceListQuery & { includeDeleted?: boolean }) {
  const rows = await loadInvoices({ includeDeleted: query.includeDeleted });
  const scoped = query.includeDeleted ? rows.filter((row) => Boolean(row.deletedAt)) : rows;
  return paginateFinanceInvoices(scoped, query);
}

// --- Payments CRUD ---
const paymentCrud = createGenericRelationalService<Payment>({
  repo: {
    listByWorkspace: listPaymentsByWorkspace,
    findById: findPaymentById,
    save: savePayment,
  },
  schema: paymentRecordSchema,
  websocketCollection: 'finance_payments',
  idPrefix: 'pay',
});

export const loadPayments = paymentCrud.loadAll;
export const updatePaymentById = paymentCrud.updateById;
export const deletePaymentById = paymentCrud.deleteById;
export const restorePaymentById = paymentCrud.restoreById;
export const bulkSoftDeletePayments = paymentCrud.bulkDeleteByIds;
export const bulkRestorePayments = paymentCrud.bulkRestoreByIds;

export async function loadPaymentsPage(query: FinanceListQuery & { includeDeleted?: boolean }) {
  const rows = await loadPayments({ includeDeleted: query.includeDeleted });
  const scoped = query.includeDeleted ? rows.filter((row) => Boolean(row.deletedAt)) : rows;
  return paginateFinancePayments(scoped, query);
}

/**
 * Creates a payment and atomically updates the linked invoice's payment details.
 */
export async function createPayment(record: PaymentCreateInput): Promise<Payment> {
  const tenant = getRequestTenant();
  if (!tenant) throw new Error('Tenant context required');
  const resolvedId = String(record.id ?? `pay-${Date.now()}`);
  const normalizedPayment = paymentRecordSchema.parse({ ...record, id: resolvedId }) as Payment;

  const savedPayment = await runInTransaction(async () => {
    const existingPayment = await findPaymentById(tenant, resolvedId);
    if (existingPayment) return existingPayment;

    const invoice = await findInvoiceById(tenant, normalizedPayment.invoiceId);
    if (!invoice || invoice.deletedAt) throw new Error('Invoice not found or deleted');

    const paidAmount = invoice.paidAmt ?? 0;
    const remainingBalance = Math.max(0, invoice.finalAmt - paidAmount);
    if (normalizedPayment.amount > remainingBalance) {
      throw new Error('Payment amount exceeds the remaining invoice balance');
    }

    const newPaid = paidAmount + normalizedPayment.amount;
    await saveInvoice(tenant, {
      ...invoice,
      status: newPaid >= invoice.finalAmt ? 'paid' : 'partial',
      paidAmt: newPaid,
      paidDate: normalizedPayment.date,
      method: normalizedPayment.method,
    });
    await savePayment(tenant, normalizedPayment);
    return normalizedPayment;
  });

  const { broadcastTenantUpdate } = await import('./websocketService.js');
  broadcastTenantUpdate(tenant, 'collection', 'finance_invoices');
  broadcastTenantUpdate(tenant, 'collection', 'finance_payments');
  return savedPayment;
}

/** ComparisonMode finance SQL aggregates (session feeCollected + dual monthly ranges). */
export async function loadFinanceReportAggregates(
  comparisonQuery?: FinanceReportComparisonQuery,
) {
  const tenant = getRequestTenant();
  if (!tenant) {
    return { comparison: { sessions: [], monthly: { a: [], b: [] } } };
  }
  const normalized = normalizeFinanceReportComparisonQuery(comparisonQuery);
  return loadFinanceReportAggregatesSql(tenant, normalized);
}
