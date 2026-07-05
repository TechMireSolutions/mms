import {
  type Invoice,
  type Payment,
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
export async function loadInvoices(options?: { includeDeleted?: boolean }): Promise<Invoice[]> {
  const tenant = getRequestTenant();
  if (!tenant) return [];
  const rawRows = await listInvoicesByWorkspace(tenant);
  return options?.includeDeleted ? rawRows : rawRows.filter((row) => !row.deletedAt);
}

export async function createInvoice(record: Invoice): Promise<Invoice> {
  const tenant = getRequestTenant();
  if (!tenant) throw new Error('Tenant context required');
  const resolvedId = String(record.id ?? `inv-${Date.now()}`);
  const normalized = invoiceRecordSchema.parse({ ...record, id: resolvedId }) as Invoice;
  await saveInvoice(tenant, normalized);
  await broadcast('finance_invoices');
  return normalized;
}

export async function updateInvoiceById(id: string, record: Invoice): Promise<Invoice | null> {
  const tenant = getRequestTenant();
  if (!tenant) return null;
  const existing = await findInvoiceById(tenant, id);
  if (!existing || existing.deletedAt) return null;
  const normalized = invoiceRecordSchema.parse({ ...record, id }) as Invoice;
  await saveInvoice(tenant, normalized);
  await broadcast('finance_invoices');
  return normalized;
}

export async function deleteInvoiceById(
  id: string,
  deletedBy: string,
  deletionReason?: string,
): Promise<boolean> {
  const tenant = getRequestTenant();
  if (!tenant) return false;
  const existing = await findInvoiceById(tenant, id);
  if (!existing || existing.deletedAt) return false;
  const updated = {
    ...existing,
    deletedAt: new Date().toISOString(),
    deletedBy,
    deletionReason: deletionReason || undefined,
  } as Invoice;
  await saveInvoice(tenant, updated);
  await broadcast('finance_invoices');
  return true;
}

export async function restoreInvoiceById(id: string): Promise<boolean> {
  const tenant = getRequestTenant();
  if (!tenant) return false;
  const existing = await findInvoiceById(tenant, id);
  if (!existing || !existing.deletedAt) return false;
  const { deletedAt: _deletedAt, deletedBy: _deletedBy, deletionReason: _deletionReason, ...rest } = existing;
  await saveInvoice(tenant, rest as Invoice);
  await broadcast('finance_invoices');
  return true;
}

// ==========================================
// 2. Finance Payments
// ==========================================
export async function loadPayments(options?: { includeDeleted?: boolean }): Promise<Payment[]> {
  const tenant = getRequestTenant();
  if (!tenant) return [];
  const rawRows = await listPaymentsByWorkspace(tenant);
  return options?.includeDeleted ? rawRows : rawRows.filter((row) => !row.deletedAt);
}

export async function deletePaymentById(
  id: string,
  deletedBy: string,
  deletionReason?: string,
): Promise<boolean> {
  const tenant = getRequestTenant();
  if (!tenant) return false;
  const existing = await findPaymentById(tenant, id);
  if (!existing || existing.deletedAt) return false;
  const updated = {
    ...existing,
    deletedAt: new Date().toISOString(),
    deletedBy,
    deletionReason: deletionReason || undefined,
  } as Payment;
  await savePayment(tenant, updated);
  await broadcast('finance_payments');
  return true;
}

export async function restorePaymentById(id: string): Promise<boolean> {
  const tenant = getRequestTenant();
  if (!tenant) return false;
  const existing = await findPaymentById(tenant, id);
  if (!existing || !existing.deletedAt) return false;
  const { deletedAt: _deletedAt, deletedBy: _deletedBy, deletionReason: _deletionReason, ...rest } = existing;
  await savePayment(tenant, rest as Payment);
  await broadcast('finance_payments');
  return true;
}

export async function updatePaymentById(id: string, record: Payment): Promise<Payment | null> {
  const tenant = getRequestTenant();
  if (!tenant) return null;
  const existing = await findPaymentById(tenant, id);
  if (!existing || existing.deletedAt) return null;
  const normalized = paymentRecordSchema.parse({ ...record, id }) as Payment;
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
      await broadcast('finance_invoices');
    }
  }

  // 2. Save the payment
  await savePayment(tenant, normalizedPayment);
  await broadcast('finance_payments');

  return normalizedPayment;
}
