import { and, eq, sql } from 'drizzle-orm';
import { type Invoice, type Payment, applyTitleCaseRecursive } from '@mms/shared';
import { getDb } from '../dbClient.js';
import { financeInvoices, financePayments } from '../schema.js';

// --- Helper row mappers ---
function rowToInvoice(row: typeof financeInvoices.$inferSelect): Invoice {
  return { ...(row.customData as Omit<Invoice, 'id'>), id: row.id } as Invoice;
}
function rowToPayment(row: typeof financePayments.$inferSelect): Payment {
  return { ...(row.customData as Omit<Payment, 'id'>), id: row.id } as Payment;
}

// ==========================================
// 1. Finance Invoices
// ==========================================
export async function listInvoicesByWorkspace(workspaceSubdomain: string): Promise<Invoice[]> {
  const subdomain = workspaceSubdomain.trim().toLowerCase();
  const rows = await getDb().select().from(financeInvoices).where(eq(financeInvoices.workspaceSubdomain, subdomain));
  return rows.map(rowToInvoice);
}

export async function findInvoiceById(workspaceSubdomain: string, id: string): Promise<Invoice | null> {
  const subdomain = workspaceSubdomain.trim().toLowerCase();
  const rows = await getDb().select().from(financeInvoices).where(and(eq(financeInvoices.workspaceSubdomain, subdomain), eq(financeInvoices.id, id)));
  const row = rows[0];
  return row ? rowToInvoice(row) : null;
}

export async function saveInvoice(workspaceSubdomain: string, record: Invoice): Promise<void> {
  const processedRecord = applyTitleCaseRecursive(record) as Invoice;
  const subdomain = workspaceSubdomain.trim().toLowerCase();
  const id = String(processedRecord.id);
  const { id: _, ...extra } = processedRecord;
  const db = getDb();

  const existing = await db
    .select({ id: financeInvoices.id })
    .from(financeInvoices)
    .where(and(eq(financeInvoices.workspaceSubdomain, subdomain), eq(financeInvoices.id, id)));

  if (existing.length > 0) {
    await db
      .update(financeInvoices)
      .set({
        customData: sql`COALESCE(${financeInvoices.customData}, '{}'::jsonb) || ${JSON.stringify(extra)}::jsonb`,
        updatedAt: new Date(),
      })
      .where(and(eq(financeInvoices.workspaceSubdomain, subdomain), eq(financeInvoices.id, id)));
  } else {
    await db.insert(financeInvoices).values({
      id,
      workspaceSubdomain: subdomain,
      customData: extra,
      updatedAt: new Date(),
    });
  }
}

export async function replaceInvoicesForWorkspace(workspaceSubdomain: string, list: Invoice[]): Promise<void> {
  const subdomain = workspaceSubdomain.trim().toLowerCase();
  const db = getDb();
  await db.delete(financeInvoices).where(eq(financeInvoices.workspaceSubdomain, subdomain));
  if (list.length === 0) return;
  const values = list.map((record) => {
    const id = String(record.id);
    const { id: _, ...extra } = record;
    return { id, workspaceSubdomain: subdomain, customData: extra, updatedAt: new Date() };
  });
  await db.insert(financeInvoices).values(values);
}

export const deleteInvoice = async (workspaceSubdomain: string, id: string): Promise<void> => {
  const subdomain = workspaceSubdomain.trim().toLowerCase();
  await getDb().delete(financeInvoices).where(and(eq(financeInvoices.workspaceSubdomain, subdomain), eq(financeInvoices.id, id)));
};

// ==========================================
// 2. Finance Payments
// ==========================================
export async function listPaymentsByWorkspace(workspaceSubdomain: string): Promise<Payment[]> {
  const subdomain = workspaceSubdomain.trim().toLowerCase();
  const rows = await getDb().select().from(financePayments).where(eq(financePayments.workspaceSubdomain, subdomain));
  return rows.map(rowToPayment);
}

export async function findPaymentById(workspaceSubdomain: string, id: string): Promise<Payment | null> {
  const subdomain = workspaceSubdomain.trim().toLowerCase();
  const rows = await getDb().select().from(financePayments).where(and(eq(financePayments.workspaceSubdomain, subdomain), eq(financePayments.id, id)));
  const row = rows[0];
  return row ? rowToPayment(row) : null;
}

export async function savePayment(workspaceSubdomain: string, record: Payment): Promise<void> {
  const processedRecord = applyTitleCaseRecursive(record) as Payment;
  const subdomain = workspaceSubdomain.trim().toLowerCase();
  const id = String(processedRecord.id);
  const { id: _, ...extra } = processedRecord;
  const db = getDb();

  const existing = await db
    .select({ id: financePayments.id })
    .from(financePayments)
    .where(and(eq(financePayments.workspaceSubdomain, subdomain), eq(financePayments.id, id)));

  if (existing.length > 0) {
    await db
      .update(financePayments)
      .set({
        customData: sql`COALESCE(${financePayments.customData}, '{}'::jsonb) || ${JSON.stringify(extra)}::jsonb`,
        updatedAt: new Date(),
      })
      .where(and(eq(financePayments.workspaceSubdomain, subdomain), eq(financePayments.id, id)));
  } else {
    await db.insert(financePayments).values({
      id,
      workspaceSubdomain: subdomain,
      customData: extra,
      updatedAt: new Date(),
    });
  }
}

export async function replacePaymentsForWorkspace(workspaceSubdomain: string, list: Payment[]): Promise<void> {
  const subdomain = workspaceSubdomain.trim().toLowerCase();
  const db = getDb();
  await db.delete(financePayments).where(eq(financePayments.workspaceSubdomain, subdomain));
  if (list.length === 0) return;
  const values = list.map((record) => {
    const id = String(record.id);
    const { id: _, ...extra } = record;
    return { id, workspaceSubdomain: subdomain, customData: extra, updatedAt: new Date() };
  });
  await db.insert(financePayments).values(values);
}

export async function deletePayment(workspaceSubdomain: string, id: string): Promise<void> {
  const subdomain = workspaceSubdomain.trim().toLowerCase();
  await getDb().delete(financePayments).where(and(eq(financePayments.workspaceSubdomain, subdomain), eq(financePayments.id, id)));
}

// ==========================================
// 3. Workspace Purge
// ==========================================
export async function deleteFinanceByWorkspace(workspaceSubdomain: string): Promise<void> {
  const subdomain = workspaceSubdomain.trim().toLowerCase();
  const db = getDb();
  await db.delete(financeInvoices).where(eq(financeInvoices.workspaceSubdomain, subdomain));
  await db.delete(financePayments).where(eq(financePayments.workspaceSubdomain, subdomain));
}
