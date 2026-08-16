import { and, eq, isNull } from 'drizzle-orm';
import { type Invoice, type Payment } from '@mms/shared';
import { financeInvoices, financePayments } from '../schema.js';
import { withTenantTransaction } from '../withTenantTransaction.js';

// --- Invoices ---

type InvoiceRow = typeof financeInvoices.$inferSelect;

export function invoiceRowToRecord(row: InvoiceRow): Invoice {
  return {
    id: row.id,
    studentId: row.studentId,
    studentName: row.studentName,
    class: row.class,
    session: row.session,
    baseFee: Number(row.baseFee ?? 0),
    discountType: row.discountType,
    discountValue: Number(row.discountValue ?? 0),
    discountAmt: Number(row.discountAmt ?? 0),
    finalAmt: Number(row.finalAmt ?? 0),
    status: row.status as Invoice['status'],
    dueDate: row.dueDate,
    paidDate: row.paidDate,
    method: row.method,
    paidAmt: row.paidAmt != null ? Number(row.paidAmt) : undefined,
    deletedAt: row.deletedAt ? row.deletedAt.toISOString() : undefined,
    deletedBy: row.deletedBy ?? undefined,
    deletionReason: row.deletionReason ?? undefined,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function listInvoicesByWorkspace(tenant: string): Promise<Invoice[]> {
  const subdomain = tenant.trim().toLowerCase();
  return withTenantTransaction(subdomain, async (tx) => {
    const rows = await tx
      .select()
      .from(financeInvoices)
      .where(and(eq(financeInvoices.workspaceSubdomain, subdomain), isNull(financeInvoices.deletedAt)));
    return rows.map(invoiceRowToRecord);
  });
}

export async function findInvoiceById(tenant: string, id: string): Promise<Invoice | null> {
  const subdomain = tenant.trim().toLowerCase();
  return withTenantTransaction(subdomain, async (tx) => {
    const rows = await tx
      .select()
      .from(financeInvoices)
      .where(and(eq(financeInvoices.workspaceSubdomain, subdomain), eq(financeInvoices.id, id)));
    const row = rows[0];
    return row ? invoiceRowToRecord(row) : null;
  });
}

export async function saveInvoice(tenant: string, record: Invoice): Promise<void> {
  const subdomain = tenant.trim().toLowerCase();
  await withTenantTransaction(subdomain, async (tx) => {
    await tx
      .insert(financeInvoices)
      .values({
        id: record.id,
        workspaceSubdomain: subdomain,
        studentId: record.studentId,
        studentName: record.studentName ?? '',
        class: record.class ?? '',
        session: record.session ?? '',
        baseFee: String(record.baseFee ?? 0),
        discountType: record.discountType ?? null,
        discountValue: String(record.discountValue ?? 0),
        discountAmt: String(record.discountAmt ?? 0),
        finalAmt: String(record.finalAmt ?? 0),
        status: record.status ?? 'pending',
        dueDate: record.dueDate,
        paidDate: record.paidDate ?? null,
        method: record.method ?? null,
        paidAmt: record.paidAmt != null ? String(record.paidAmt) : null,
        deletedAt: record.deletedAt ? new Date(record.deletedAt) : null,
        deletedBy: record.deletedBy ?? null,
        deletionReason: record.deletionReason ?? null,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: [financeInvoices.workspaceSubdomain, financeInvoices.id],
        set: {
          studentId: record.studentId,
          studentName: record.studentName ?? '',
          class: record.class ?? '',
          session: record.session ?? '',
          baseFee: String(record.baseFee ?? 0),
          discountType: record.discountType ?? null,
          discountValue: String(record.discountValue ?? 0),
          discountAmt: String(record.discountAmt ?? 0),
          finalAmt: String(record.finalAmt ?? 0),
          status: record.status ?? 'pending',
          dueDate: record.dueDate,
          paidDate: record.paidDate ?? null,
          method: record.method ?? null,
          paidAmt: record.paidAmt != null ? String(record.paidAmt) : null,
          deletedAt: record.deletedAt ? new Date(record.deletedAt) : null,
          deletedBy: record.deletedBy ?? null,
          deletionReason: record.deletionReason ?? null,
          updatedAt: new Date(),
        },
      });
  });
}

export async function bulkSaveInvoices(tenant: string, records: Invoice[]): Promise<void> {
  if (records.length === 0) return;
  const subdomain = tenant.trim().toLowerCase();
  await withTenantTransaction(subdomain, async (tx) => {
    for (const r of records) {
      await tx
        .insert(financeInvoices)
        .values({
          id: r.id,
          workspaceSubdomain: subdomain,
          studentId: r.studentId,
          studentName: r.studentName ?? '',
          class: r.class ?? '',
          session: r.session ?? '',
          baseFee: String(r.baseFee ?? 0),
          discountType: r.discountType ?? null,
          discountValue: String(r.discountValue ?? 0),
          discountAmt: String(r.discountAmt ?? 0),
          finalAmt: String(r.finalAmt ?? 0),
          status: r.status ?? 'pending',
          dueDate: r.dueDate,
          paidDate: r.paidDate ?? null,
          method: r.method ?? null,
          paidAmt: r.paidAmt != null ? String(r.paidAmt) : null,
          deletedAt: r.deletedAt ? new Date(r.deletedAt) : null,
          deletedBy: r.deletedBy ?? null,
          deletionReason: r.deletionReason ?? null,
          updatedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: [financeInvoices.workspaceSubdomain, financeInvoices.id],
          set: {
            studentId: r.studentId,
            studentName: r.studentName ?? '',
            class: r.class ?? '',
            session: r.session ?? '',
            baseFee: String(r.baseFee ?? 0),
            discountType: r.discountType ?? null,
            discountValue: String(r.discountValue ?? 0),
            discountAmt: String(r.discountAmt ?? 0),
            finalAmt: String(r.finalAmt ?? 0),
            status: r.status ?? 'pending',
            dueDate: r.dueDate,
            paidDate: r.paidDate ?? null,
            method: r.method ?? null,
            paidAmt: r.paidAmt != null ? String(r.paidAmt) : null,
            deletedAt: r.deletedAt ? new Date(r.deletedAt) : null,
            deletedBy: r.deletedBy ?? null,
            deletionReason: r.deletionReason ?? null,
            updatedAt: new Date(),
          },
        });
    }
  });
}

export async function replaceInvoicesForWorkspace(tenant: string, records: Invoice[]): Promise<void> {
  const subdomain = tenant.trim().toLowerCase();
  await withTenantTransaction(subdomain, async (tx) => {
    await tx.delete(financeInvoices).where(eq(financeInvoices.workspaceSubdomain, subdomain));
    for (const r of records) {
      await tx.insert(financeInvoices).values({
        id: r.id,
        workspaceSubdomain: subdomain,
        studentId: r.studentId,
        studentName: r.studentName ?? '',
        class: r.class ?? '',
        session: r.session ?? '',
        baseFee: String(r.baseFee ?? 0),
        discountType: r.discountType ?? null,
        discountValue: String(r.discountValue ?? 0),
        discountAmt: String(r.discountAmt ?? 0),
        finalAmt: String(r.finalAmt ?? 0),
        status: r.status ?? 'pending',
        dueDate: r.dueDate,
        paidDate: r.paidDate ?? null,
        method: r.method ?? null,
        paidAmt: r.paidAmt != null ? String(r.paidAmt) : null,
        deletedAt: r.deletedAt ? new Date(r.deletedAt) : null,
        deletedBy: r.deletedBy ?? null,
        deletionReason: r.deletionReason ?? null,
        updatedAt: new Date(),
      });
    }
  });
}

export async function deleteInvoice(tenant: string, id: string): Promise<void> {
  const subdomain = tenant.trim().toLowerCase();
  await withTenantTransaction(subdomain, async (tx) => {
    await tx
      .delete(financeInvoices)
      .where(and(eq(financeInvoices.workspaceSubdomain, subdomain), eq(financeInvoices.id, id)));
  });
}

// --- Payments ---

type PaymentRow = typeof financePayments.$inferSelect;

export function paymentRowToRecord(row: PaymentRow): Payment {
  return {
    id: row.id,
    invoiceId: row.invoiceId,
    studentId: row.studentId ?? undefined,
    studentName: row.studentName ?? undefined,
    amount: Number(row.amount ?? 0),
    date: row.date,
    method: row.method,
    receivedByUserId: row.receivedByUserId ?? undefined,
    receivedBy: row.receivedBy ?? undefined,
    note: row.note,
    deletedAt: row.deletedAt ? row.deletedAt.toISOString() : undefined,
    deletedBy: row.deletedBy ?? undefined,
    deletionReason: row.deletionReason ?? undefined,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function listPaymentsByWorkspace(tenant: string): Promise<Payment[]> {
  const subdomain = tenant.trim().toLowerCase();
  return withTenantTransaction(subdomain, async (tx) => {
    const rows = await tx
      .select()
      .from(financePayments)
      .where(and(eq(financePayments.workspaceSubdomain, subdomain), isNull(financePayments.deletedAt)));
    return rows.map(paymentRowToRecord);
  });
}

export async function findPaymentById(tenant: string, id: string): Promise<Payment | null> {
  const subdomain = tenant.trim().toLowerCase();
  return withTenantTransaction(subdomain, async (tx) => {
    const rows = await tx
      .select()
      .from(financePayments)
      .where(and(eq(financePayments.workspaceSubdomain, subdomain), eq(financePayments.id, id)));
    const row = rows[0];
    return row ? paymentRowToRecord(row) : null;
  });
}

export async function savePayment(tenant: string, record: Payment): Promise<void> {
  const subdomain = tenant.trim().toLowerCase();
  await withTenantTransaction(subdomain, async (tx) => {
    await tx
      .insert(financePayments)
      .values({
        id: record.id,
        workspaceSubdomain: subdomain,
        invoiceId: record.invoiceId,
        studentId: record.studentId ?? null,
        studentName: record.studentName ?? null,
        amount: String(record.amount ?? 0),
        date: record.date,
        method: record.method ?? 'cash',
        receivedByUserId: record.receivedByUserId ?? null,
        receivedBy: record.receivedBy ?? null,
        note: record.note ?? '',
        deletedAt: record.deletedAt ? new Date(record.deletedAt) : null,
        deletedBy: record.deletedBy ?? null,
        deletionReason: record.deletionReason ?? null,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: [financePayments.workspaceSubdomain, financePayments.id],
        set: {
          invoiceId: record.invoiceId,
          studentId: record.studentId ?? null,
          studentName: record.studentName ?? null,
          amount: String(record.amount ?? 0),
          date: record.date,
          method: record.method ?? 'cash',
          receivedByUserId: record.receivedByUserId ?? null,
          receivedBy: record.receivedBy ?? null,
          note: record.note ?? '',
          deletedAt: record.deletedAt ? new Date(record.deletedAt) : null,
          deletedBy: record.deletedBy ?? null,
          deletionReason: record.deletionReason ?? null,
          updatedAt: new Date(),
        },
      });
  });
}

export async function bulkSavePayments(tenant: string, records: Payment[]): Promise<void> {
  if (records.length === 0) return;
  const subdomain = tenant.trim().toLowerCase();
  await withTenantTransaction(subdomain, async (tx) => {
    for (const r of records) {
      await tx
        .insert(financePayments)
        .values({
          id: r.id,
          workspaceSubdomain: subdomain,
          invoiceId: r.invoiceId,
          studentId: r.studentId ?? null,
          studentName: r.studentName ?? null,
          amount: String(r.amount ?? 0),
          date: r.date,
          method: r.method ?? 'cash',
          receivedByUserId: r.receivedByUserId ?? null,
          receivedBy: r.receivedBy ?? null,
          note: r.note ?? '',
          deletedAt: r.deletedAt ? new Date(r.deletedAt) : null,
          deletedBy: r.deletedBy ?? null,
          deletionReason: r.deletionReason ?? null,
          updatedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: [financePayments.workspaceSubdomain, financePayments.id],
          set: {
            invoiceId: r.invoiceId,
            studentId: r.studentId ?? null,
            studentName: r.studentName ?? null,
            amount: String(r.amount ?? 0),
            date: r.date,
            method: r.method ?? 'cash',
            receivedByUserId: r.receivedByUserId ?? null,
            receivedBy: r.receivedBy ?? null,
            note: r.note ?? '',
            deletedAt: r.deletedAt ? new Date(r.deletedAt) : null,
            deletedBy: r.deletedBy ?? null,
            deletionReason: r.deletionReason ?? null,
            updatedAt: new Date(),
          },
        });
    }
  });
}

export async function replacePaymentsForWorkspace(tenant: string, records: Payment[]): Promise<void> {
  const subdomain = tenant.trim().toLowerCase();
  await withTenantTransaction(subdomain, async (tx) => {
    await tx.delete(financePayments).where(eq(financePayments.workspaceSubdomain, subdomain));
    for (const r of records) {
      await tx.insert(financePayments).values({
        id: r.id,
        workspaceSubdomain: subdomain,
        invoiceId: r.invoiceId,
        studentId: r.studentId ?? null,
        studentName: r.studentName ?? null,
        amount: String(r.amount ?? 0),
        date: r.date,
        method: r.method ?? 'cash',
        receivedByUserId: r.receivedByUserId ?? null,
        receivedBy: r.receivedBy ?? null,
        note: r.note ?? '',
        deletedAt: r.deletedAt ? new Date(r.deletedAt) : null,
        deletedBy: r.deletedBy ?? null,
        deletionReason: r.deletionReason ?? null,
        updatedAt: new Date(),
      });
    }
  });
}

export async function deletePayment(tenant: string, id: string): Promise<void> {
  const subdomain = tenant.trim().toLowerCase();
  await withTenantTransaction(subdomain, async (tx) => {
    await tx
      .delete(financePayments)
      .where(and(eq(financePayments.workspaceSubdomain, subdomain), eq(financePayments.id, id)));
  });
}

export async function deleteFinanceByWorkspace(workspaceSubdomain: string): Promise<void> {
  const subdomain = workspaceSubdomain.trim().toLowerCase();
  await withTenantTransaction(subdomain, async (tx) => {
    await tx.delete(financePayments).where(eq(financePayments.workspaceSubdomain, subdomain));
    await tx.delete(financeInvoices).where(eq(financeInvoices.workspaceSubdomain, subdomain));
  });
}
