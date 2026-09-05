import type { AccountingRepository } from '../repository/accountingRepository.js';
import { accountingRepository } from '../repository/accountingRepositoryAdapter.js';
import { getRequestTenant } from '../../lib/tenantContext.js';
import { createGenericRelationalService } from '../../services/genericRelationalService.js';
import {
  defineTenantBulkCollectionService,
  scopeDeleted,
  upsertWithBroadcast,
} from '../../services/tenantBulkService.js';
import {
  EMPTY_ACCOUNTING_REPORT_AGGREGATES,
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

/**
 * Accounting use-cases — composition root binding an {@link AccountingRepository}
 * to every operation. Production uses the default Drizzle-backed
 * `accountingUseCases`; tests can pass a fake repository to exercise
 * orchestration in isolation.
 */
export function createAccountingUseCases(repo: AccountingRepository = accountingRepository) {
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
    },
    schema: accountRecordSchema,
    websocketCollection: 'accounting_accounts',
    idPrefix: 'acc',
  });

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

    loadAccounts: async (options?: { includeDeleted?: boolean }): Promise<Account[]> => {
      const rows = await accountCrud.loadAll({ includeDeleted: true });
      return scopeDeleted(rows, options?.includeDeleted);
    },

    loadEntries: async (options?: { includeDeleted?: boolean }): Promise<JournalEntry[]> => {
      const rows = await entryCrud.loadAll({ includeDeleted: true });
      return scopeDeleted(rows, options?.includeDeleted);
    },

    loadFiscalYears: fiscalYearService.load,

    upsertAccounts: (accounts: Account[]) =>
      upsertWithBroadcast(accountListSchema, accounts, repo.bulkSaveAccounts, 'accounting_accounts'),
    upsertEntries: async (entries: JournalEntry[]) => {
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
    },

    deleteAccountById: accountCrud.deleteById,
    restoreAccountById: accountCrud.restoreById,
    bulkSoftDeleteAccounts: accountCrud.bulkDeleteByIds,
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
