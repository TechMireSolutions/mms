import { type Invoice, type Payment } from '@mms/shared';
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
import { createGenericRelationalService } from './genericRelationalService.js';

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
export const createInvoice = invoiceCrud.create;
export const updateInvoiceById = invoiceCrud.updateById;
export const deleteInvoiceById = invoiceCrud.deleteById;
export const restoreInvoiceById = invoiceCrud.restoreById;

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

/**
 * Creates a payment and atomically updates the linked invoice's payment details.
 */
export async function createPayment(record: Payment): Promise<Payment> {
  const tenant = getRequestTenant();
  if (!tenant) throw new Error('Tenant context required');
  const resolvedId = String(record.id ?? `pay-${Date.now()}`);
  const normalizedPayment = paymentRecordSchema.parse({ ...record, id: resolvedId }) as Payment;

  // 1. Update matching invoice if found
  if (normalizedPayment.invoiceId) {
    const invoice = await findInvoiceById(tenant, normalizedPayment.invoiceId);
    if (invoice && !invoice.deletedAt) {
      const newPaid = (invoice.paidAmt || 0) + normalizedPayment.amount;
      const updatedInvoice: Invoice = {
        ...invoice,
        status: (newPaid >= invoice.finalAmt ? 'paid' : 'partial') as Invoice['status'],
        paidAmt: newPaid,
        paidDate: normalizedPayment.date,
        method: normalizedPayment.method,
      };
      await saveInvoice(tenant, updatedInvoice);
      const { broadcastTenantUpdate } = await import('./websocketService.js');
      broadcastTenantUpdate(tenant, 'collection', 'finance_invoices');
    }
  }

  // 2. Save the payment
  await savePayment(tenant, normalizedPayment);
  const { broadcastTenantUpdate } = await import('./websocketService.js');
  broadcastTenantUpdate(tenant, 'collection', 'finance_payments');

  return normalizedPayment;
}
