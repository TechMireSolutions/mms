import { listAccountsPage, listEntriesPage, listFiscalYearsPage } from "../db/repositories/accountingRepositoryList.js";
import type { AccountingListQuery } from "@mms/shared";
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
import {
  defineTenantBulkCollectionService,
  scopeDeleted,
  upsertWithBroadcast,
} from './tenantBulkService.js';
import { createGenericRelationalService } from './genericRelationalService.js';
import { getRequestTenant } from '../lib/tenantContext.js';

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
export const upsertAccounts = (accounts: Account[]) =>
  upsertWithBroadcast(accountListSchema, accounts, bulkSaveAccounts, 'accounting_accounts');

/** Upserts journal entries without removing unrelated rows. */
export const upsertEntries = (entries: JournalEntry[]) =>
  upsertWithBroadcast(journalEntryListSchema, entries, bulkSaveEntries, 'accounting_entries');

/** Upserts fiscal years without removing unrelated rows. */
export const upsertFiscalYears = (fiscalYears: FiscalYear[]) =>
  upsertWithBroadcast(fiscalYearListSchema, fiscalYears, bulkSaveFiscalYears, 'accounting_fiscal_years');

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

export async function loadAccountsPage(query: AccountingListQuery & { includeDeleted?: boolean }) {
  const tenant = getRequestTenant();
  if (!tenant) {
    return { accounts: [], total: 0, page: query.page ?? 1, limit: query.limit ?? 12, hasMore: false };
  }
  return listAccountsPage(tenant, query);
}

export async function loadEntriesPage(query: AccountingListQuery & { includeDeleted?: boolean }) {
  const tenant = getRequestTenant();
  if (!tenant) {
    return { entries: [], total: 0, page: query.page ?? 1, limit: query.limit ?? 12, hasMore: false };
  }
  return listEntriesPage(tenant, query);
}

export async function loadFiscalYearsPage(query: AccountingListQuery & { includeDeleted?: boolean }) {
  const tenant = getRequestTenant();
  if (!tenant) {
    return { fiscalYears: [], total: 0, page: query.page ?? 1, limit: query.limit ?? 12, hasMore: false };
  }
  return listFiscalYearsPage(tenant, query);
}
