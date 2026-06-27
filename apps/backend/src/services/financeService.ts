import {
  type Invoice,
  type Payment,
  invoiceListSchema,
  invoiceRecordSchema,
  paymentListSchema,
  paymentRecordSchema,
} from '@mms/shared';
import { defineCollectionCrudService } from './collectionCrudService.js';
import { fetchCollection, persistCollection } from './dbSyncService.js';

const INVOICES_COLLECTION = 'finance_invoices';
const PAYMENTS_COLLECTION = 'finance_payments';

const normalizeInvoice = (record: Invoice) => invoiceRecordSchema.parse(record);
const invoiceCrud = defineCollectionCrudService(INVOICES_COLLECTION, invoiceListSchema, normalizeInvoice);

export const loadInvoices = invoiceCrud.load;
export const createInvoice = invoiceCrud.create;
export const updateInvoiceById = invoiceCrud.updateById;
export const deleteInvoiceById = invoiceCrud.deleteById;

const normalizePayment = (record: Payment) => paymentRecordSchema.parse(record);
const paymentCrud = defineCollectionCrudService(PAYMENTS_COLLECTION, paymentListSchema, normalizePayment);

export const loadPayments = paymentCrud.load;
export const deletePaymentById = paymentCrud.deleteById;
export const updatePaymentById = paymentCrud.updateById;

/**
 * Creates a payment and atomically updates the linked invoice's payment details.
 */
export async function createPayment(record: Payment): Promise<Payment> {
  const normalizedPayment = normalizePayment(record);

  // 1. Load all invoices
  const invoiceRows = await fetchCollection(INVOICES_COLLECTION);
  const parsedInvoices = invoiceListSchema.safeParse(invoiceRows ?? []);
  const invoices = parsedInvoices.success ? parsedInvoices.data : [];

  // 2. Update matching invoice if found
  let invoiceUpdated = false;
  const nextInvoices = invoices.map((inv) => {
    if (inv.id !== normalizedPayment.invoiceId) return inv;
    invoiceUpdated = true;
    const newPaid = (inv.paidAmt || 0) + normalizedPayment.amount;
    return {
      ...inv,
      status: (newPaid >= inv.finalAmt ? 'paid' : 'partial') as Invoice['status'],
      paidAmt: newPaid,
      paidDate: normalizedPayment.date,
      method: normalizedPayment.method,
    };
  });

  if (invoiceUpdated) {
    await persistCollection(INVOICES_COLLECTION, nextInvoices);
  }

  // 3. Save the payment
  const payments = await loadPayments();
  payments.push(normalizedPayment);
  await persistCollection(PAYMENTS_COLLECTION, payments);

  return normalizedPayment;
}
