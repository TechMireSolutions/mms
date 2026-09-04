import { and, eq, isNull, sql } from 'drizzle-orm';
import { type Invoice } from '@mms/shared';
import { financeInvoices } from '../schema.js';
import { withTenant } from '../tenant-context.js';

type InvoiceRow = typeof financeInvoices.$inferSelect;

export function invoiceRowToRecord(row: InvoiceRow): Invoice {
  const invoice: Invoice = {
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
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };

  if (row.paidAmt != null) invoice.paidAmt = Number(row.paidAmt);
  if (row.deletedAt) invoice.deletedAt = row.deletedAt.toISOString();
  if (row.deletedBy) invoice.deletedBy = row.deletedBy;
  if (row.deletionReason) invoice.deletionReason = row.deletionReason;

  return invoice;
}

export async function listInvoicesByWorkspace(
  tenant: string,
  options?: { limit?: number; offset?: number },
): Promise<Invoice[]> {
  const subdomain = tenant.trim().toLowerCase();
  const limit = Math.min(Math.max(options?.limit ?? 500, 1), 5000);
  const offset = Math.max(options?.offset ?? 0, 0);
  return withTenant(subdomain, async (tx) => {
    const rows = await tx
      .select({
        id: financeInvoices.id,
        workspaceSubdomain: financeInvoices.workspaceSubdomain,
        studentId: financeInvoices.studentId,
        studentName: financeInvoices.studentName,
        class: financeInvoices.class,
        session: financeInvoices.session,
        baseFee: financeInvoices.baseFee,
        discountType: financeInvoices.discountType,
        discountValue: financeInvoices.discountValue,
        discountAmt: financeInvoices.discountAmt,
        finalAmt: financeInvoices.finalAmt,
        status: financeInvoices.status,
        dueDate: financeInvoices.dueDate,
        paidDate: financeInvoices.paidDate,
        method: financeInvoices.method,
        paidAmt: financeInvoices.paidAmt,
        deletedAt: financeInvoices.deletedAt,
        deletedBy: financeInvoices.deletedBy,
        deletionReason: financeInvoices.deletionReason,
        createdAt: financeInvoices.createdAt,
        updatedAt: financeInvoices.updatedAt,
      })
      .from(financeInvoices)
      .where(and(eq(financeInvoices.workspaceSubdomain, subdomain), isNull(financeInvoices.deletedAt)))
      .limit(limit)
      .offset(offset);
    return rows.map(invoiceRowToRecord);
  });
}

export async function findInvoiceById(tenant: string, id: string): Promise<Invoice | null> {
  const subdomain = tenant.trim().toLowerCase();
  return withTenant(subdomain, async (tx) => {
    const rows = await tx
      .select({
        id: financeInvoices.id,
        workspaceSubdomain: financeInvoices.workspaceSubdomain,
        studentId: financeInvoices.studentId,
        studentName: financeInvoices.studentName,
        class: financeInvoices.class,
        session: financeInvoices.session,
        baseFee: financeInvoices.baseFee,
        discountType: financeInvoices.discountType,
        discountValue: financeInvoices.discountValue,
        discountAmt: financeInvoices.discountAmt,
        finalAmt: financeInvoices.finalAmt,
        status: financeInvoices.status,
        dueDate: financeInvoices.dueDate,
        paidDate: financeInvoices.paidDate,
        method: financeInvoices.method,
        paidAmt: financeInvoices.paidAmt,
        deletedAt: financeInvoices.deletedAt,
        deletedBy: financeInvoices.deletedBy,
        deletionReason: financeInvoices.deletionReason,
        createdAt: financeInvoices.createdAt,
        updatedAt: financeInvoices.updatedAt,
      })
      .from(financeInvoices)
      .where(and(eq(financeInvoices.workspaceSubdomain, subdomain), eq(financeInvoices.id, id)))
      .limit(1);
    const row = rows[0];
    return row ? invoiceRowToRecord(row) : null;
  });
}

export async function saveInvoice(tenant: string, record: Invoice): Promise<void> {
  const subdomain = tenant.trim().toLowerCase();
  await withTenant(subdomain, async (tx) => {
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
  await withTenant(subdomain, async (tx) => {
    await tx
      .insert(financeInvoices)
      .values(
        records.map((r) => ({
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
        })),
      )
      .onConflictDoUpdate({
        target: [financeInvoices.workspaceSubdomain, financeInvoices.id],
        set: {
          studentId: sql`excluded.student_id`,
          studentName: sql`excluded.student_name`,
          class: sql`excluded.class`,
          session: sql`excluded.session`,
          baseFee: sql`excluded.base_fee`,
          discountType: sql`excluded.discount_type`,
          discountValue: sql`excluded.discount_value`,
          discountAmt: sql`excluded.discount_amt`,
          finalAmt: sql`excluded.final_amt`,
          status: sql`excluded.status`,
          dueDate: sql`excluded.due_date`,
          paidDate: sql`excluded.paid_date`,
          method: sql`excluded.method`,
          paidAmt: sql`excluded.paid_amt`,
          deletedAt: sql`excluded.deleted_at`,
          deletedBy: sql`excluded.deleted_by`,
          deletionReason: sql`excluded.deletion_reason`,
          updatedAt: new Date(),
        },
      });
  });
}

export async function replaceInvoicesForWorkspace(tenant: string, records: Invoice[]): Promise<void> {
  const subdomain = tenant.trim().toLowerCase();
  await withTenant(subdomain, async (tx) => {
    await tx.delete(financeInvoices).where(eq(financeInvoices.workspaceSubdomain, subdomain));
    if (records.length > 0) {
      await tx.insert(financeInvoices).values(
        records.map((r) => ({
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
        })),
      );
    }
  });
}

export async function deleteInvoice(tenant: string, id: string): Promise<void> {
  const subdomain = tenant.trim().toLowerCase();
  await withTenant(subdomain, async (tx) => {
    await tx
      .delete(financeInvoices)
      .where(and(eq(financeInvoices.workspaceSubdomain, subdomain), eq(financeInvoices.id, id)));
  });
}
