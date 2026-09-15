import type { AccountingRepository } from '../repository/accountingRepository.js';
import { accountingRepository } from '../repository/accountingRepositoryAdapter.js';
import { getRequestTenant } from '../../lib/tenantContext.js';
import { createGenericRelationalService } from '../../services/genericRelationalService.js';
import {
  defineTenantBulkCollectionService,
  upsertWithBroadcast,
} from '../../services/tenantBulkService.js';
import {
  EMPTY_ACCOUNTING_REPORT_AGGREGATES,
  dedupeTrimmedIds,
  moneyToCents,
  type Account,
  type JournalEntry,
  type FiscalYear,
  type AccountingCommandMetricsSnapshot,
  type AccountingListQuery,
  type AccountingReportAggregates,
  type AccountingReportQuery,
  accountListSchema,
  journalEntryListSchema,
  fiscalYearListSchema,
  journalEntryRecordSchema,
  accountRecordSchema,
} from '@mms/shared';
import { prepareJournalEntryForPersist } from './accountingLedgerGuards.js';

const EMPTY_ACCOUNTING_METRICS: AccountingCommandMetricsSnapshot = {
  totalEntries: 0,
  posted: 0,
  draft: 0,
  activeAccounts: 0,
  inactiveAccounts: 0,
  newThisPeriod: 0,
  postedVolume: 0,
  revenue: 0,
  expenses: 0,
  surplus: 0,
  assets: 0,
  liabilities: 0,
};

function normalizeLines(lines: JournalEntry['lines']): string {
  return (lines ?? [])
    .map((line) =>
      [line.account_id, moneyToCents(line.debit), moneyToCents(line.credit), line.description ?? ''].join('|'),
    )
    .sort()
    .join(';');
}

function normalizeList(values: readonly string[] | undefined): string {
  return [...(values ?? [])].sort().join('|');
}

/**
 * True when a posted entry's financial content differs from what is stored.
 * Identity/audit fields (ids, created_by, timestamps) are intentionally ignored.
 */
function journalEntryContentChanged(incoming: JournalEntry, stored: JournalEntry): boolean {
  return (
    incoming.date !== stored.date ||
    (incoming.ref ?? '') !== (stored.ref ?? '') ||
    (incoming.description ?? '') !== (stored.description ?? '') ||
    incoming.status !== stored.status ||
    (incoming.fiscal_year ?? '') !== (stored.fiscal_year ?? '') ||
    (incoming.fiscal_year_id ?? '') !== (stored.fiscal_year_id ?? '') ||
    (incoming.source_type ?? '') !== (stored.source_type ?? '') ||
    (incoming.source_id ?? '') !== (stored.source_id ?? '') ||
    (incoming.transaction_type ?? '') !== (stored.transaction_type ?? '') ||
    (incoming.reversed_ref ?? '') !== (stored.reversed_ref ?? '') ||
    Boolean(incoming.simple_mode) !== Boolean(stored.simple_mode) ||
    normalizeLines(incoming.lines) !== normalizeLines(stored.lines) ||
    normalizeList(incoming.tags) !== normalizeList(stored.tags) ||
    normalizeList(incoming.attachments) !== normalizeList(stored.attachments)
  );
}

export interface AccountingUseCasesDependencies {
  countActiveJournalLinesForAccount?: (tenant: string, accountId: string) => Promise<number>;
  countActiveJournalLinesForAccounts?: (tenant: string, accountIds: string[]) => Promise<Map<string, number>>;
}

/**
 * Accounting use-cases — composition root binding an {@link AccountingRepository}
 * to every operation. Production uses the default Drizzle-backed
 * `accountingUseCases`; tests can pass a fake repository to exercise
 * orchestration in isolation.
 */
export function createAccountingUseCases(
  repo: AccountingRepository = accountingRepository,
  deps?: AccountingUseCasesDependencies,
) {
  const accountService = defineTenantBulkCollectionService<Account>(
    { listByWorkspace: repo.listAccountsByWorkspace, replaceForWorkspace: repo.replaceAccountsForWorkspace },
    accountListSchema,
    'accounting_accounts',
  );

  const entryBulkService = defineTenantBulkCollectionService<JournalEntry>(
    { listByWorkspace: repo.listEntriesByWorkspace, replaceForWorkspace: repo.replaceEntriesForWorkspace },
    journalEntryListSchema,
    'accounting_entries',
  );

  const fiscalYearService = defineTenantBulkCollectionService<FiscalYear>(
    { listByWorkspace: repo.listFiscalYearsByWorkspace, replaceForWorkspace: repo.replaceFiscalYearsForWorkspace },
    fiscalYearListSchema,
    'accounting_fiscal_years',
  );

  const entryCrud = createGenericRelationalService<JournalEntry>({
    repo: {
      listByWorkspace: repo.listEntriesByWorkspace,
      findById: repo.findEntryById,
      save: repo.saveEntry,
      bulkDelete: repo.bulkSoftDeleteEntries,
      bulkRestore: repo.bulkRestoreEntries,
    },
    schema: journalEntryRecordSchema,
    websocketCollection: 'accounting_entries',
    idPrefix: 'je',
  });

  const accountCrud = createGenericRelationalService<Account>({
    repo: {
      listByWorkspace: repo.listAccountsByWorkspace,
      findById: repo.findAccountById,
      save: repo.saveAccount,
      bulkDelete: repo.bulkSoftDeleteAccounts,
      bulkRestore: repo.bulkRestoreAccounts,
    },
    schema: accountRecordSchema,
    websocketCollection: 'accounting_accounts',
    idPrefix: 'acc',
  });

  /**
   * Append-only immutability: posted journal entries may not be edited in
   * place — corrections must be posted as reversals/adjustments. Unchanged
   * posted rows are tolerated because the Work directory saves the whole
   * collection back through the bulk upsert route.
   */
  const assertEntriesMutable = async (entries: JournalEntry[]): Promise<void> => {
    const tenant = getRequestTenant();
    if (!tenant || !repo.findPostedEntryIds || entries.length === 0) return;
    const postedIds = await repo.findPostedEntryIds(tenant, entries.map((entry) => entry.id));
    if (postedIds.length === 0) return;
    const postedSet = new Set(postedIds);
    const stored = await repo.findEntriesByIds(tenant, postedIds);
    const storedById = new Map(stored.map((entry) => [entry.id, entry]));
    for (const incoming of entries) {
      if (!postedSet.has(incoming.id)) continue;
      const existing = storedById.get(incoming.id);
      if (existing && journalEntryContentChanged(incoming, existing)) {
        throw Object.assign(
          new Error('Posted journal entries are immutable — reverse them instead of editing'),
          { statusCode: 422, type: 'validation_error' },
        );
      }
    }
  };

  const deleteJournalEntryById = async (
    id: string,
    deletedBy: string,
    deletionReason?: string,
  ): Promise<boolean> => {
    const tenant = getRequestTenant();
    if (!tenant) return false;
    const existing = await repo.findEntryById(tenant, id);
    if (!existing || existing.deletedAt) return false;
    if (existing.status === 'posted') {
      throw new Error('Posted journal entries cannot be deleted');
    }
    return entryCrud.deleteById(id, deletedBy, deletionReason);
  };

  return {
    /** Full-collection replace retained for internal/admin tools only — routes must use upsert. */
    replaceAccounts: accountService.replace,
    replaceEntries: entryBulkService.replace,
    replaceFiscalYears: fiscalYearService.replace,

    loadAccounts: (options?: { includeDeleted?: boolean }) => accountCrud.loadAll(options),

    loadAccountById: async (id: string, includeDeleted = false): Promise<Account | null> => {
      const tenant = getRequestTenant();
      const cleanId = id?.trim();
      if (!tenant || !cleanId) return null;
      const row = await repo.findAccountById(tenant, cleanId);
      if (!row) return null;
      if (!includeDeleted && row.deletedAt) return null;
      return row;
    },

    loadAccountsByIds: async (ids: string[], includeDeleted = false): Promise<Account[]> => {
      const tenant = getRequestTenant();
      const cleanIds = dedupeTrimmedIds(ids);
      if (!tenant || cleanIds.length === 0) return [];
      return repo.findAccountsByIds(tenant, cleanIds, { includeDeleted });
    },

    loadEntries: (options?: { includeDeleted?: boolean }) => entryCrud.loadAll(options),

    loadEntryById: async (id: string, includeDeleted = false): Promise<JournalEntry | null> => {
      const tenant = getRequestTenant();
      const cleanId = id?.trim();
      if (!tenant || !cleanId) return null;
      const row = await repo.findEntryById(tenant, cleanId);
      if (!row) return null;
      if (!includeDeleted && row.deletedAt) return null;
      return row;
    },

    loadEntriesByIds: async (ids: string[], includeDeleted = false): Promise<JournalEntry[]> => {
      const tenant = getRequestTenant();
      const cleanIds = dedupeTrimmedIds(ids);
      if (!tenant || cleanIds.length === 0) return [];
      return repo.findEntriesByIds(tenant, cleanIds, { includeDeleted });
    },

    loadFiscalYears: async (options?: { includeDeleted?: boolean }): Promise<FiscalYear[]> => {
      const tenant = getRequestTenant();
      if (!tenant) return [];
      return repo.listFiscalYearsByWorkspace(tenant, options);
    },

    loadFiscalYearById: async (id: string, includeDeleted = false): Promise<FiscalYear | null> => {
      const tenant = getRequestTenant();
      const cleanId = id?.trim();
      if (!tenant || !cleanId) return null;
      const row = await repo.findFiscalYearById(tenant, cleanId);
      if (!row) return null;
      if (!includeDeleted && row.deletedAt) return null;
      return row;
    },

    loadFiscalYearsByIds: async (ids: string[], includeDeleted = false): Promise<FiscalYear[]> => {
      const tenant = getRequestTenant();
      const cleanIds = dedupeTrimmedIds(ids);
      if (!tenant || cleanIds.length === 0) return [];
      return repo.findFiscalYearsByIds(tenant, cleanIds, { includeDeleted });
    },

    upsertAccounts: (accounts: Account[]) =>
      upsertWithBroadcast(accountListSchema, accounts, repo.bulkSaveAccounts, 'accounting_accounts'),
    upsertEntries: async (entries: JournalEntry[]) => {
      await assertEntriesMutable(entries);
      const fiscalYears = await fiscalYearService.load();
      const prepared = entries.map((entry) => prepareJournalEntryForPersist(entry, fiscalYears));
      return upsertWithBroadcast(journalEntryListSchema, prepared, repo.bulkSaveEntries, 'accounting_entries');
    },
    upsertFiscalYears: (fiscalYears: FiscalYear[]) =>
      upsertWithBroadcast(fiscalYearListSchema, fiscalYears, repo.bulkSaveFiscalYears, 'accounting_fiscal_years'),

    createJournalEntry: async (record: JournalEntry) => {
      const fiscalYears = await fiscalYearService.load();
      return entryCrud.create(prepareJournalEntryForPersist(record, fiscalYears));
    },
    updateJournalEntryById: async (id: string, record: JournalEntry) => {
      await assertEntriesMutable([{ ...record, id }]);
      const fiscalYears = await fiscalYearService.load();
      return entryCrud.updateById(id, prepareJournalEntryForPersist(record, fiscalYears));
    },
    restoreJournalEntryById: entryCrud.restoreById,
    bulkRestoreJournalEntries: entryCrud.bulkRestoreByIds,

    deleteJournalEntryById,

    bulkSoftDeleteJournalEntries: async (
      ids: string[],
      deletedBy: string,
      deletionReason?: string,
    ): Promise<{ succeeded: number; failed: number }> => {
      const cleanIds = dedupeTrimmedIds(ids);
      if (cleanIds.length === 0) return { succeeded: 0, failed: 0 };
      const tenant = getRequestTenant();
      if (repo.bulkSoftDeleteEntries && tenant) {
        const result = await repo.bulkSoftDeleteEntries(tenant, cleanIds, deletedBy, deletionReason);
        if (result.succeeded > 0) {
          const { broadcastTenantUpdate } = await import('../../services/websocketService.js');
          broadcastTenantUpdate(tenant, 'collection', 'accounting_entries');
        }
        return result;
      }
      let succeeded = 0;
      let failed = 0;
      for (const id of cleanIds) {
        try {
          const ok = await deleteJournalEntryById(id, deletedBy, deletionReason);
          if (ok) succeeded += 1;
          else failed += 1;
        } catch {
          failed += 1;
        }
      }
      return { succeeded, failed };
    },

    deleteAccountById: async (
      id: string,
      deletedBy: string,
      deletionReason?: string,
    ): Promise<boolean> => {
      const tenant = getRequestTenant();
      if (!tenant) throw new Error('Tenant context required');
      const cleanId = id?.trim();
      if (!cleanId) return false;
      const getActiveCount =
        deps?.countActiveJournalLinesForAccount ??
        (await import('../../db/repositories/accountingAccountsRepository.js'))
          .countActiveJournalLinesForAccount;
      const activeCount = await getActiveCount(tenant, cleanId);
      if (activeCount > 0) {
        const err = new Error('Cannot archive account with active ledger entries');
        (err as Error & { statusCode: number }).statusCode = 400;
        throw err;
      }
      return accountCrud.deleteById(cleanId, deletedBy, deletionReason);
    },
    restoreAccountById: accountCrud.restoreById,
    bulkSoftDeleteAccounts: async (
      ids: string[],
      deletedBy: string,
      deletionReason?: string,
    ): Promise<{ succeeded: number; failed: number }> => {
      const tenant = getRequestTenant();
      if (!tenant) return { succeeded: 0, failed: ids.length };
      const cleanIds = dedupeTrimmedIds(ids);
      if (cleanIds.length === 0) return { succeeded: 0, failed: 0 };
      const getActiveCounts =
        deps?.countActiveJournalLinesForAccounts ??
        (await import('../../db/repositories/accountingAccountsRepository.js'))
          .countActiveJournalLinesForAccounts;
      const activeCounts = await getActiveCounts(tenant, cleanIds);
      const blockedIds = new Set<string>();
      for (const [accId, count] of activeCounts.entries()) {
        if (count > 0) blockedIds.add(accId);
      }
      const allowedIds = cleanIds.filter((id) => !blockedIds.has(id));
      if (allowedIds.length === 0) {
        return { succeeded: 0, failed: cleanIds.length };
      }
      const result = await accountCrud.bulkDeleteByIds(allowedIds, deletedBy, deletionReason);
      return {
        succeeded: result.succeeded,
        failed: result.failed + blockedIds.size,
      };
    },
    bulkRestoreAccounts: accountCrud.bulkRestoreByIds,

    loadAccountsPage: async (query: AccountingListQuery & { includeDeleted?: boolean }) => {
      const tenant = getRequestTenant();
      if (!tenant) {
        return { accounts: [], total: 0, page: query.page ?? 1, limit: query.limit ?? 12, hasMore: false };
      }
      return repo.listAccountsPage(tenant, query);
    },

    loadEntriesPage: async (query: AccountingListQuery & { includeDeleted?: boolean }) => {
      const tenant = getRequestTenant();
      if (!tenant) {
        return { entries: [], total: 0, page: query.page ?? 1, limit: query.limit ?? 12, hasMore: false };
      }
      return repo.listEntriesPage(tenant, query);
    },

    loadFiscalYearsPage: async (query: AccountingListQuery & { includeDeleted?: boolean }) => {
      const tenant = getRequestTenant();
      if (!tenant) {
        return { fiscalYears: [], total: 0, page: query.page ?? 1, limit: query.limit ?? 12, hasMore: false };
      }
      return repo.listFiscalYearsPage(tenant, query);
    },

    loadAccountingCommandMetrics: async (): Promise<AccountingCommandMetricsSnapshot> => {
      const tenant = getRequestTenant();
      if (!tenant) return EMPTY_ACCOUNTING_METRICS;
      return repo.aggregateAccountingCommandMetrics(tenant);
    },

    loadAccountingReportAggregates: async (
      query: AccountingReportQuery = {},
    ): Promise<AccountingReportAggregates> => {
      const tenant = getRequestTenant();
      if (!tenant) return EMPTY_ACCOUNTING_REPORT_AGGREGATES;
      return repo.aggregateAccountingReport(tenant, query);
    },
  };
}

export const accountingUseCases = createAccountingUseCases();
