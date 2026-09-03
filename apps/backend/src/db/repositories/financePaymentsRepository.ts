import { and, eq, isNull, sql } from 'drizzle-orm';
import { type Payment } from '@mms/shared';
import { financeInvoices, financePayments } from '../schema.js';
import { withTenant } from '../tenant-context.js';

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

export async function listPaymentsByWorkspace(
  tenant: string,
  options?: { limit?: number; offset?: number },
): Promise<Payment[]> {
  const subdomain = tenant.trim().toLowerCase();
  const limit = Math.min(Math.max(options?.limit ?? 500, 1), 5000);
  const offset = Math.max(options?.offset ?? 0, 0);
  return withTenant(subdomain, async (tx) => {
    const rows = await tx
      .select({
        id: financePayments.id,
        workspaceSubdomain: financePayments.workspaceSubdomain,
        invoiceId: financePayments.invoiceId,
        studentId: financePayments.studentId,
        studentName: financePayments.studentName,
        amount: financePayments.amount,
        date: financePayments.date,
        method: financePayments.method,
        receivedByUserId: financePayments.receivedByUserId,
        receivedBy: financePayments.receivedBy,
        note: financePayments.note,
        deletedAt: financePayments.deletedAt,
        deletedBy: financePayments.deletedBy,
        deletionReason: financePayments.deletionReason,
        createdAt: financePayments.createdAt,
        updatedAt: financePayments.updatedAt,
      })
      .from(financePayments)
      .where(and(eq(financePayments.workspaceSubdomain, subdomain), isNull(financePayments.deletedAt)))
      .limit(limit)
      .offset(offset);
    return rows.map(paymentRowToRecord);
  });
}

export async function findPaymentById(tenant: string, id: string): Promise<Payment | null> {
  const subdomain = tenant.trim().toLowerCase();
  return withTenant(subdomain, async (tx) => {
    const rows = await tx
      .select({
        id: financePayments.id,
        workspaceSubdomain: financePayments.workspaceSubdomain,
        invoiceId: financePayments.invoiceId,
        studentId: financePayments.studentId,
        studentName: financePayments.studentName,
        amount: financePayments.amount,
        date: financePayments.date,
        method: financePayments.method,
        receivedByUserId: financePayments.receivedByUserId,
        receivedBy: financePayments.receivedBy,
        note: financePayments.note,
        deletedAt: financePayments.deletedAt,
        deletedBy: financePayments.deletedBy,
        deletionReason: financePayments.deletionReason,
        createdAt: financePayments.createdAt,
        updatedAt: financePayments.updatedAt,
      })
      .from(financePayments)
      .where(and(eq(financePayments.workspaceSubdomain, subdomain), eq(financePayments.id, id)))
      .limit(1);
    const row = rows[0];
    return row ? paymentRowToRecord(row) : null;
  });
}

export async function savePayment(tenant: string, record: Payment): Promise<void> {
  const subdomain = tenant.trim().toLowerCase();
  await withTenant(subdomain, async (tx) => {
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
  await withTenant(subdomain, async (tx) => {
    await tx
      .insert(financePayments)
      .values(
        records.map((r) => ({
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
        })),
      )
      .onConflictDoUpdate({
        target: [financePayments.workspaceSubdomain, financePayments.id],
        set: {
          invoiceId: sql`excluded.invoice_id`,
          studentId: sql`excluded.student_id`,
          studentName: sql`excluded.student_name`,
          amount: sql`excluded.amount`,
          date: sql`excluded.date`,
          method: sql`excluded.method`,
          receivedByUserId: sql`excluded.received_by_user_id`,
          receivedBy: sql`excluded.received_by`,
          note: sql`excluded.note`,
          deletedAt: sql`excluded.deleted_at`,
          deletedBy: sql`excluded.deleted_by`,
          deletionReason: sql`excluded.deletion_reason`,
          updatedAt: new Date(),
        },
      });
  });
}

export async function replacePaymentsForWorkspace(tenant: string, records: Payment[]): Promise<void> {
  const subdomain = tenant.trim().toLowerCase();
  await withTenant(subdomain, async (tx) => {
    await tx.delete(financePayments).where(eq(financePayments.workspaceSubdomain, subdomain));
    if (records.length > 0) {
      await tx.insert(financePayments).values(
        records.map((r) => ({
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
        })),
      );
    }
  });
}

export async function deletePayment(tenant: string, id: string): Promise<void> {
  const subdomain = tenant.trim().toLowerCase();
  await withTenant(subdomain, async (tx) => {
    await tx
      .delete(financePayments)
      .where(and(eq(financePayments.workspaceSubdomain, subdomain), eq(financePayments.id, id)));
  });
}

export async function deleteFinanceByWorkspace(workspaceSubdomain: string): Promise<void> {
  const subdomain = workspaceSubdomain.trim().toLowerCase();
  await withTenant(subdomain, async (tx) => {
    await tx.delete(financePayments).where(eq(financePayments.workspaceSubdomain, subdomain));
    await tx.delete(financeInvoices).where(eq(financeInvoices.workspaceSubdomain, subdomain));
  });
}
