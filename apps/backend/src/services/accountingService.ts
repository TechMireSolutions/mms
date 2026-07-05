import {
  type Account,
  type JournalEntry,
  type FiscalYear,
  accountListSchema,
  journalEntryListSchema,
  fiscalYearListSchema,
} from '@mms/shared';
import { getRequestTenant } from '../lib/tenantContext.js';
import {
  listAccountsByWorkspace,
  replaceAccountsForWorkspace,
  listEntriesByWorkspace,
  replaceEntriesForWorkspace,
  listFiscalYearsByWorkspace,
  replaceFiscalYearsForWorkspace,
} from '../db/repositories/accountingRepository.js';

// --- Helper WebSocket broadcaster ---
async function broadcast(logicalKey: string) {
  const tenant = getRequestTenant();
  if (tenant) {
    const { broadcastTenantUpdate } = await import('./websocketService.js');
    broadcastTenantUpdate(tenant, 'collection', logicalKey);
  }
}

// --- Accounts ---
export async function loadAccounts(): Promise<Account[]> {
  const tenant = getRequestTenant();
  if (!tenant) return [];
  return listAccountsByWorkspace(tenant);
}

export async function replaceAccounts(records: Account[]): Promise<Account[]> {
  const tenant = getRequestTenant();
  if (!tenant) throw new Error('Tenant context required');
  const parsed = accountListSchema.parse(records);
  await replaceAccountsForWorkspace(tenant, parsed);
  await broadcast('accounting_accounts');
  return parsed;
}

// --- Entries ---
export async function loadEntries(): Promise<JournalEntry[]> {
  const tenant = getRequestTenant();
  if (!tenant) return [];
  return listEntriesByWorkspace(tenant);
}

export async function replaceEntries(records: JournalEntry[]): Promise<JournalEntry[]> {
  const tenant = getRequestTenant();
  if (!tenant) throw new Error('Tenant context required');
  const parsed = journalEntryListSchema.parse(records);
  await replaceEntriesForWorkspace(tenant, parsed);
  await broadcast('accounting_entries');
  return parsed;
}

// --- Fiscal Years ---
export async function loadFiscalYears(): Promise<FiscalYear[]> {
  const tenant = getRequestTenant();
  if (!tenant) return [];
  return listFiscalYearsByWorkspace(tenant);
}

export async function replaceFiscalYears(records: FiscalYear[]): Promise<FiscalYear[]> {
  const tenant = getRequestTenant();
  if (!tenant) throw new Error('Tenant context required');
  const parsed = fiscalYearListSchema.parse(records);
  await replaceFiscalYearsForWorkspace(tenant, parsed);
  await broadcast('accounting_fiscal_years');
  return parsed;
}
