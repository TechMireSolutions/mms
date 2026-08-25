import { and, eq, isNull } from 'drizzle-orm';
import { type Invoice } from '@mms/shared';
import { financeInvoices } from '../schema.js';
import { withTenant } from '../tenant-context.js';

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
  return withTenant(subdomain, async (tx) => {
    const rows = await tx
      .select()
      .from(financeInvoices)
      .where(and(eq(financeInvoices.workspaceSubdomain, subdomain), isNull(financeInvoices.deletedAt)));
    return rows.map(invoiceRowToRecord);
  });
}

export async function findInvoiceById(tenant: string, id: string): Promise<Invoice | null> {
  const subdomain = tenant.trim().toLowerCase();
  return withTenant(subdomain, async (tx) => {
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
  await withTenant(subdomain, async (tx) => {
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
  await withTenant(subdomain, async (tx) => {
    await tx
      .delete(financeInvoices)
      .where(and(eq(financeInvoices.workspaceSubdomain, subdomain), eq(financeInvoices.id, id)));
  });
}
