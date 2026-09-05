import { and, eq, isNull, sql } from 'drizzle-orm';
import { type Invoice } from '@mms/shared';
import { financeInvoiceLines, financeInvoices } from '../schema.js';
import { withTenant } from '../tenant-context.js';
import { invoiceWriteValues } from './financeInvoiceValues.js';
import { invoiceLineRowToRecord, replaceInvoiceLines } from './financeBillingRepository.js';

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
  if (row.invoiceNumber) invoice.invoiceNumber = row.invoiceNumber;
  if (row.feeStructureId) invoice.feeStructureId = row.feeStructureId;
  if (row.billingPeriod) invoice.billingPeriod = row.billingPeriod;
  if (row.enrollmentId) invoice.enrollmentId = row.enrollmentId;
  if (row.familyContactId) invoice.familyContactId = row.familyContactId;
  if (Number(row.lateFeeAmt ?? 0) > 0) invoice.lateFeeAmt = Number(row.lateFeeAmt);
  if (Number(row.creditedAmt ?? 0) > 0) invoice.creditedAmt = Number(row.creditedAmt);
  if (row.lastRemindedAt) invoice.lastRemindedAt = row.lastRemindedAt.toISOString();
  if (row.reminderCount) invoice.reminderCount = row.reminderCount;
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
        invoiceNumber: financeInvoices.invoiceNumber,
        feeStructureId: financeInvoices.feeStructureId,
        billingPeriod: financeInvoices.billingPeriod,
        enrollmentId: financeInvoices.enrollmentId,
        familyContactId: financeInvoices.familyContactId,
        lateFeeAmt: financeInvoices.lateFeeAmt,
        creditedAmt: financeInvoices.creditedAmt,
        lastRemindedAt: financeInvoices.lastRemindedAt,
        reminderCount: financeInvoices.reminderCount,
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
        invoiceNumber: financeInvoices.invoiceNumber,
        feeStructureId: financeInvoices.feeStructureId,
        billingPeriod: financeInvoices.billingPeriod,
        enrollmentId: financeInvoices.enrollmentId,
        familyContactId: financeInvoices.familyContactId,
        lateFeeAmt: financeInvoices.lateFeeAmt,
        creditedAmt: financeInvoices.creditedAmt,
        lastRemindedAt: financeInvoices.lastRemindedAt,
        reminderCount: financeInvoices.reminderCount,
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
    if (!row) return null;
    const lineRows = await tx
      .select({
        id: financeInvoiceLines.id,
        workspaceSubdomain: financeInvoiceLines.workspaceSubdomain,
        invoiceId: financeInvoiceLines.invoiceId,
        feeItemId: financeInvoiceLines.feeItemId,
        description: financeInvoiceLines.description,
        quantity: financeInvoiceLines.quantity,
        amount: financeInvoiceLines.amount,
        discountAmt: financeInvoiceLines.discountAmt,
        createdAt: financeInvoiceLines.createdAt,
      })
      .from(financeInvoiceLines)
      .where(
        and(eq(financeInvoiceLines.workspaceSubdomain, subdomain), eq(financeInvoiceLines.invoiceId, id)),
      );
    return { ...invoiceRowToRecord(row), lines: lineRows.map(invoiceLineRowToRecord) };
  });
}

export async function saveInvoice(tenant: string, record: Invoice): Promise<void> {
  const subdomain = tenant.trim().toLowerCase();
  const values = invoiceWriteValues(subdomain, record);
  await withTenant(subdomain, async (tx) => {
    await tx
      .insert(financeInvoices)
      .values(values)
      .onConflictDoUpdate({
        target: [financeInvoices.workspaceSubdomain, financeInvoices.id],
        set: {
          studentId: values.studentId,
          studentName: values.studentName,
          class: values.class,
          session: values.session,
          baseFee: values.baseFee,
          discountType: values.discountType,
          discountValue: values.discountValue,
          discountAmt: values.discountAmt,
          finalAmt: values.finalAmt,
          status: values.status,
          dueDate: values.dueDate,
          paidDate: values.paidDate,
          method: values.method,
          paidAmt: values.paidAmt,
          invoiceNumber: values.invoiceNumber,
          feeStructureId: values.feeStructureId,
          billingPeriod: values.billingPeriod,
          enrollmentId: values.enrollmentId,
          familyContactId: values.familyContactId,
          lateFeeAmt: values.lateFeeAmt,
          creditedAmt: values.creditedAmt,
          lastRemindedAt: values.lastRemindedAt,
          reminderCount: values.reminderCount,
          deletedAt: values.deletedAt,
          deletedBy: values.deletedBy,
          deletionReason: values.deletionReason,
          updatedAt: values.updatedAt,
        },
      });
  });
  if (record.lines) {
    await replaceInvoiceLines(tenant, record.id, record.lines);
  }
}

export async function bulkSaveInvoices(tenant: string, records: Invoice[]): Promise<void> {
  if (records.length === 0) return;
  const subdomain = tenant.trim().toLowerCase();
  await withTenant(subdomain, async (tx) => {
    await tx
      .insert(financeInvoices)
      .values(
        records.map((r) => invoiceWriteValues(subdomain, r)),
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
          invoiceNumber: sql`excluded.invoice_number`,
          feeStructureId: sql`excluded.fee_structure_id`,
          billingPeriod: sql`excluded.billing_period`,
          enrollmentId: sql`excluded.enrollment_id`,
          familyContactId: sql`excluded.family_contact_id`,
          lateFeeAmt: sql`excluded.late_fee_amt`,
          creditedAmt: sql`excluded.credited_amt`,
          lastRemindedAt: sql`excluded.last_reminded_at`,
          reminderCount: sql`excluded.reminder_count`,
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
      await tx.insert(financeInvoices).values(records.map((r) => invoiceWriteValues(subdomain, r)));
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
