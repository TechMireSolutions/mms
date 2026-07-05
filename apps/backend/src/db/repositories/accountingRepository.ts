import { eq } from 'drizzle-orm';
import { type Account, type JournalEntry, type FiscalYear } from '@mms/shared';
import { getDb } from '../dbClient.js';
import {
  accountingAccounts,
  accountingEntries,
  accountingFiscalYears,
} from '../schema.js';

// --- Helper row mappers ---
function rowToAccount(row: typeof accountingAccounts.$inferSelect): Account {
  return { ...(row.customData as Omit<Account, 'id'>), id: row.id } as Account;
}
function rowToEntry(row: typeof accountingEntries.$inferSelect): JournalEntry {
  return { ...(row.customData as Omit<JournalEntry, 'id'>), id: row.id } as JournalEntry;
}
function rowToFiscalYear(row: typeof accountingFiscalYears.$inferSelect): FiscalYear {
  return { ...(row.customData as Omit<FiscalYear, 'id'>), id: row.id } as FiscalYear;
}

// ==========================================
// 1. Accounts
// ==========================================
export async function listAccountsByWorkspace(workspaceSubdomain: string): Promise<Account[]> {
  const subdomain = workspaceSubdomain.trim().toLowerCase();
  const rows = await getDb().select().from(accountingAccounts).where(eq(accountingAccounts.workspaceSubdomain, subdomain));
  return rows.map(rowToAccount);
}

export async function replaceAccountsForWorkspace(workspaceSubdomain: string, list: Account[]): Promise<void> {
  const subdomain = workspaceSubdomain.trim().toLowerCase();
  const db = getDb();
  await db.delete(accountingAccounts).where(eq(accountingAccounts.workspaceSubdomain, subdomain));
  if (list.length === 0) return;
  const values = list.map((record) => {
    const id = String(record.id);
    const { id: _, ...extra } = record;
    return { id, workspaceSubdomain: subdomain, customData: extra, updatedAt: new Date() };
  });
  await db.insert(accountingAccounts).values(values);
}

// ==========================================
// 2. Journal Entries
// ==========================================
export async function listEntriesByWorkspace(workspaceSubdomain: string): Promise<JournalEntry[]> {
  const subdomain = workspaceSubdomain.trim().toLowerCase();
  const rows = await getDb().select().from(accountingEntries).where(eq(accountingEntries.workspaceSubdomain, subdomain));
  return rows.map(rowToEntry);
}

export async function replaceEntriesForWorkspace(workspaceSubdomain: string, list: JournalEntry[]): Promise<void> {
  const subdomain = workspaceSubdomain.trim().toLowerCase();
  const db = getDb();
  await db.delete(accountingEntries).where(eq(accountingEntries.workspaceSubdomain, subdomain));
  if (list.length === 0) return;
  const values = list.map((record) => {
    const id = String(record.id);
    const { id: _, ...extra } = record;
    return { id, workspaceSubdomain: subdomain, customData: extra, updatedAt: new Date() };
  });
  await db.insert(accountingEntries).values(values);
}

// ==========================================
// 3. Fiscal Years
// ==========================================
export async function listFiscalYearsByWorkspace(workspaceSubdomain: string): Promise<FiscalYear[]> {
  const subdomain = workspaceSubdomain.trim().toLowerCase();
  const rows = await getDb().select().from(accountingFiscalYears).where(eq(accountingFiscalYears.workspaceSubdomain, subdomain));
  return rows.map(rowToFiscalYear);
}

export async function replaceFiscalYearsForWorkspace(workspaceSubdomain: string, list: FiscalYear[]): Promise<void> {
  const subdomain = workspaceSubdomain.trim().toLowerCase();
  const db = getDb();
  await db.delete(accountingFiscalYears).where(eq(accountingFiscalYears.workspaceSubdomain, subdomain));
  if (list.length === 0) return;
  const values = list.map((record) => {
    const id = String(record.id);
    const { id: _, ...extra } = record;
    return { id, workspaceSubdomain: subdomain, customData: extra, updatedAt: new Date() };
  });
  await db.insert(accountingFiscalYears).values(values);
}

// ==========================================
// 4. Workspace Purge
// ==========================================
export async function deleteAccountingByWorkspace(workspaceSubdomain: string): Promise<void> {
  const subdomain = workspaceSubdomain.trim().toLowerCase();
  const db = getDb();
  await db.delete(accountingAccounts).where(eq(accountingAccounts.workspaceSubdomain, subdomain));
  await db.delete(accountingEntries).where(eq(accountingEntries.workspaceSubdomain, subdomain));
  await db.delete(accountingFiscalYears).where(eq(accountingFiscalYears.workspaceSubdomain, subdomain));
}
