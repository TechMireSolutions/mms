import {
  type Invoice,
  type Payment,
  invoiceRecordSchema,
  paymentRecordSchema,
} from '@mms/shared';
import { getRequestTenant } from '../lib/tenantContext.js';
import {
  listInvoicesByWorkspace,
  findInvoiceById,
  saveInvoice,
  listPaymentsByWorkspace,
  findPaymentById,
  savePayment,
  deletePayment,
} from '../db/repositories/financeRepository.js';

// --- Helper WebSocket broadcaster ---
async function broadcast(logicalKey: string) {
  const tenant = getRequestTenant();
  if (tenant) {
    const { broadcastTenantUpdate } = await import('./websocketService.js');
    broadcastTenantUpdate(tenant, 'collection', logicalKey);
  }
}

// ==========================================
// 1. Finance Invoices
// ==========================================
export async function loadInvoices(): Promise<Invoice[]> {
  const tenant = getRequestTenant();
  if (!tenant) return [];
  return listInvoicesByWorkspace(tenant);
}

export async function createInvoice(record: Invoice): Promise<Invoice> {
  const tenant = getRequestTenant();
  if (!tenant) throw new Error('Tenant context required');
  const resolvedId = String(record.id ?? `inv-${Date.now()}`);
  const normalized = invoiceRecordSchema.parse({ ...record, id: resolvedId });
  await saveInvoice(tenant, normalized);
  await broadcast('finance_invoices');
  return normalized;
}

export async function updateInvoiceById(id: string, record: Invoice): Promise<Invoice | null> {
  const tenant = getRequestTenant();
  if (!tenant) return null;
  const existing = await findInvoiceById(tenant, id);
  if (!existing) return null;
  const normalized = invoiceRecordSchema.parse({ ...record, id });
  await saveInvoice(tenant, normalized);
  await broadcast('finance_invoices');
  return normalized;
}

export async function deleteInvoiceById(id: string): Promise<boolean> {
  const tenant = getRequestTenant();
  if (!tenant) return false;
  const existing = await findInvoiceById(tenant, id);
  if (!existing) return false;
  const { deleteInvoice } = await import('../db/repositories/financeRepository.js');
  await deleteInvoice(tenant, id);
  await broadcast('finance_invoices');
  return true;
}

// ==========================================
// 2. Finance Payments
// ==========================================
export async function loadPayments(): Promise<Payment[]> {
  const tenant = getRequestTenant();
  if (!tenant) return [];
  return listPaymentsByWorkspace(tenant);
}

export async function deletePaymentById(id: string): Promise<boolean> {
  const tenant = getRequestTenant();
  if (!tenant) return false;
  const existing = await findPaymentById(tenant, id);
  if (!existing) return false;
  await deletePayment(tenant, id);
  await broadcast('finance_payments');
  return true;
}

export async function updatePaymentById(id: string, record: Payment): Promise<Payment | null> {
  const tenant = getRequestTenant();
  if (!tenant) return null;
  const existing = await findPaymentById(tenant, id);
  if (!existing) return null;
  const normalized = paymentRecordSchema.parse({ ...record, id });
  await savePayment(tenant, normalized);
  await broadcast('finance_payments');
  return normalized;
}

/**
 * Creates a payment and atomically updates the linked invoice's payment details.
 */
export async function createPayment(record: Payment): Promise<Payment> {
  const tenant = getRequestTenant();
  if (!tenant) throw new Error('Tenant context required');
  const resolvedId = String(record.id ?? `pay-${Date.now()}`);
  const normalizedPayment = paymentRecordSchema.parse({ ...record, id: resolvedId });

  // 1. Update matching invoice if found
  if (normalizedPayment.invoiceId) {
    const invoice = await findInvoiceById(tenant, normalizedPayment.invoiceId);
    if (invoice) {
      const newPaid = (invoice.paidAmt || 0) + normalizedPayment.amount;
      const updatedInvoice: Invoice = {
        ...invoice,
        status: (newPaid >= invoice.finalAmt ? 'paid' : 'partial') as Invoice['status'],
        paidAmt: newPaid,
        paidDate: normalizedPayment.date,
        method: normalizedPayment.method,
      };
      await saveInvoice(tenant, updatedInvoice);
      await broadcast('finance_invoices');
    }
  }

  // 2. Save the payment
  await savePayment(tenant, normalizedPayment);
  await broadcast('finance_payments');

  return normalizedPayment;
}
