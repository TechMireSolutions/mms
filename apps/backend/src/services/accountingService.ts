import {
  type Account,
  type JournalEntry,
  type FiscalYear,
  accountListSchema,
  journalEntryListSchema,
  fiscalYearListSchema,
  journalEntryRecordSchema,
  accountRecordSchema,
} from '@mms/shared';
import {
  listAccountsByWorkspace,
  findAccountById,
  saveAccount,
  bulkSaveAccounts,
  replaceAccountsForWorkspace,
  listEntriesByWorkspace,
  findEntryById,
  saveEntry,
  bulkSaveEntries,
  replaceEntriesForWorkspace,
  listFiscalYearsByWorkspace,
  bulkSaveFiscalYears,
  replaceFiscalYearsForWorkspace,
} from '../db/repositories/accountingRepository.js';
import { defineTenantBulkCollectionService } from './tenantBulkService.js';
import { createGenericRelationalService } from './genericRelationalService.js';
import { getRequestTenant } from '../lib/tenantContext.js';
import { broadcastCollection } from './websocketService.js';

const accountService = defineTenantBulkCollectionService<Account>(
  { listByWorkspace: listAccountsByWorkspace, replaceForWorkspace: replaceAccountsForWorkspace },
  accountListSchema,
  'accounting_accounts',
);

const entryBulkService = defineTenantBulkCollectionService<JournalEntry>(
  { listByWorkspace: listEntriesByWorkspace, replaceForWorkspace: replaceEntriesForWorkspace },
  journalEntryListSchema,
  'accounting_entries',
);

const fiscalYearService = defineTenantBulkCollectionService<FiscalYear>(
  { listByWorkspace: listFiscalYearsByWorkspace, replaceForWorkspace: replaceFiscalYearsForWorkspace },
  fiscalYearListSchema,
  'accounting_fiscal_years',
);

/** Full-collection replace retained for internal/admin tools only — routes must use upsert. */
export const replaceAccounts = accountService.replace;
export const replaceEntries = entryBulkService.replace;
export const replaceFiscalYears = fiscalYearService.replace;

const entryCrud = createGenericRelationalService<JournalEntry>({
  repo: {
    listByWorkspace: listEntriesByWorkspace,
    findById: findEntryById,
    save: saveEntry,
  },
  schema: journalEntryRecordSchema,
  websocketCollection: 'accounting_entries',
  idPrefix: 'je',
});

const accountCrud = createGenericRelationalService<Account>({
  repo: {
    listByWorkspace: listAccountsByWorkspace,
    findById: findAccountById,
    save: saveAccount,
  },
  schema: accountRecordSchema,
  websocketCollection: 'accounting_accounts',
  idPrefix: 'acc',
});

function scopeDeleted<T extends { deletedAt?: string | null }>(
  rows: T[],
  includeDeleted?: boolean,
): T[] {
  if (includeDeleted) return rows.filter((row) => Boolean(row.deletedAt));
  return rows.filter((row) => !row.deletedAt);
}

export async function loadAccounts(options?: { includeDeleted?: boolean }): Promise<Account[]> {
  const rows = await accountCrud.loadAll({ includeDeleted: true });
  return scopeDeleted(rows, options?.includeDeleted);
}

export async function loadEntries(options?: { includeDeleted?: boolean }): Promise<JournalEntry[]> {
  const rows = await entryCrud.loadAll({ includeDeleted: true });
  return scopeDeleted(rows, options?.includeDeleted);
}

export const loadFiscalYears = fiscalYearService.load;

/** Upserts accounts without removing unrelated rows. */
export async function upsertAccounts(accounts: Account[]): Promise<Account[]> {
  const tenant = getRequestTenant();
  if (!tenant) throw new Error('Tenant context required');
  const parsed = accountListSchema.parse(accounts);
  await bulkSaveAccounts(tenant, parsed);
  await broadcastCollection('accounting_accounts');
  return parsed;
}

/** Upserts journal entries without removing unrelated rows. */
export async function upsertEntries(entries: JournalEntry[]): Promise<JournalEntry[]> {
  const tenant = getRequestTenant();
  if (!tenant) throw new Error('Tenant context required');
  const parsed = journalEntryListSchema.parse(entries);
  await bulkSaveEntries(tenant, parsed);
  await broadcastCollection('accounting_entries');
  return parsed;
}

/** Upserts fiscal years without removing unrelated rows. */
export async function upsertFiscalYears(fiscalYears: FiscalYear[]): Promise<FiscalYear[]> {
  const tenant = getRequestTenant();
  if (!tenant) throw new Error('Tenant context required');
  const parsed = fiscalYearListSchema.parse(fiscalYears);
  await bulkSaveFiscalYears(tenant, parsed);
  await broadcastCollection('accounting_fiscal_years');
  return parsed;
}

export const createJournalEntry = entryCrud.create;
export const updateJournalEntryById = entryCrud.updateById;
export const restoreJournalEntryById = entryCrud.restoreById;
export const bulkRestoreJournalEntries = entryCrud.bulkRestoreByIds;

export async function deleteJournalEntryById(
  id: string,
  deletedBy: string,
  deletionReason?: string,
): Promise<boolean> {
  const tenant = getRequestTenant();
  if (!tenant) return false;
  const existing = await findEntryById(tenant, id);
  if (!existing || existing.deletedAt) return false;
  if (existing.status === 'posted') {
    throw new Error('Posted journal entries cannot be deleted');
  }
  return entryCrud.deleteById(id, deletedBy, deletionReason);
}

export async function bulkSoftDeleteJournalEntries(
  ids: string[],
  deletedBy: string,
  deletionReason?: string,
): Promise<{ succeeded: number; failed: number }> {
  let succeeded = 0;
  let failed = 0;
  for (const id of ids) {
    try {
      const ok = await deleteJournalEntryById(id, deletedBy, deletionReason);
      if (ok) succeeded += 1;
      else failed += 1;
    } catch {
      failed += 1;
    }
  }
  return { succeeded, failed };
}

export const deleteAccountById = accountCrud.deleteById;
export const restoreAccountById = accountCrud.restoreById;
export const bulkSoftDeleteAccounts = accountCrud.bulkDeleteByIds;
export const bulkRestoreAccounts = accountCrud.bulkRestoreByIds;
