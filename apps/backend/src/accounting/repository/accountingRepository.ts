import type {
  Account,
  JournalEntry,
  FiscalYear,
  AccountingListQuery,
  AccountingAccountsListPageResult,
  AccountingEntriesListPageResult,
  AccountingFiscalYearsListPageResult,
  AccountingCommandMetricsSnapshot,
  AccountingReportAggregates,
  AccountingReportQuery,
} from '@mms/shared';

/**
 * Sole storage gateway for the accounting module (accounts, journal entries,
 * fiscal years).
 *
 * Mirrors the `contacts`/`sessions`/`enrollments`/`finance`/`attendance`/`hasanat`/
 * `questionBank`/`examinations`/`obligations` reference pattern: routes and
 * use-cases depend on this interface (never on Drizzle directly), and the
 * Drizzle-backed adapter is the only implementation. Tests can inject a fake
 * repository at the seam.
 */
export interface AccountingRepository {
  // Accounts
  listAccountsByWorkspace(
    tenant: string,
    options?: { deleted?: 'active' | 'deleted' | 'all'; includeDeleted?: boolean },
  ): Promise<Account[]>;
  findAccountById(tenant: string, id: string): Promise<Account | null>;
  findAccountsByIds(
    tenant: string,
    ids: string[],
    options?: { deleted?: 'active' | 'deleted' | 'all'; includeDeleted?: boolean },
  ): Promise<Account[]>;
  saveAccount(tenant: string, record: Account): Promise<void>;
  bulkSaveAccounts(tenant: string, records: Account[]): Promise<void>;
  replaceAccountsForWorkspace(tenant: string, records: Account[]): Promise<void>;
  listAccountsPage(tenant: string, query: AccountingListQuery): Promise<AccountingAccountsListPageResult>;
  bulkSoftDeleteAccounts?(
    tenant: string,
    ids: string[],
    deletedBy?: string,
    deletionReason?: string,
  ): Promise<{ succeeded: number; failed: number }>;
  bulkRestoreAccounts?(
    tenant: string,
    ids: string[],
    userId?: string,
  ): Promise<{ succeeded: number; failed: number }>;

  // Journal entries
  listEntriesByWorkspace(
    tenant: string,
    options?: { deleted?: 'active' | 'deleted' | 'all'; includeDeleted?: boolean; limit?: number; offset?: number },
  ): Promise<JournalEntry[]>;
  findEntryById(tenant: string, id: string): Promise<JournalEntry | null>;
  findEntriesByIds(
    tenant: string,
    ids: string[],
    options?: { deleted?: 'active' | 'deleted' | 'all'; includeDeleted?: boolean },
  ): Promise<JournalEntry[]>;
  saveEntry(tenant: string, record: JournalEntry): Promise<void>;
  bulkSaveEntries(tenant: string, records: JournalEntry[]): Promise<void>;
  replaceEntriesForWorkspace(tenant: string, records: JournalEntry[]): Promise<void>;
  listEntriesPage(tenant: string, query: AccountingListQuery): Promise<AccountingEntriesListPageResult>;
  bulkSoftDeleteEntries?(
    tenant: string,
    ids: string[],
    deletedBy?: string,
    deletionReason?: string,
  ): Promise<{ succeeded: number; failed: number }>;
  bulkRestoreEntries?(
    tenant: string,
    ids: string[],
    userId?: string,
  ): Promise<{ succeeded: number; failed: number }>;

  // Fiscal years
  listFiscalYearsByWorkspace(
    tenant: string,
    options?: { deleted?: 'active' | 'deleted' | 'all'; includeDeleted?: boolean },
  ): Promise<FiscalYear[]>;
  findFiscalYearById(tenant: string, id: string): Promise<FiscalYear | null>;
  findFiscalYearsByIds(
    tenant: string,
    ids: string[],
    options?: { deleted?: 'active' | 'deleted' | 'all'; includeDeleted?: boolean },
  ): Promise<FiscalYear[]>;
  saveFiscalYear(tenant: string, record: FiscalYear): Promise<void>;
  bulkSaveFiscalYears(tenant: string, records: FiscalYear[]): Promise<void>;
  replaceFiscalYearsForWorkspace(tenant: string, records: FiscalYear[]): Promise<void>;
  listFiscalYearsPage(tenant: string, query: AccountingListQuery): Promise<AccountingFiscalYearsListPageResult>;

  // Aggregates
  aggregateAccountingCommandMetrics(
    tenant: string,
    periodDays?: number,
  ): Promise<AccountingCommandMetricsSnapshot>;
  aggregateAccountingReport(
    tenant: string,
    query?: AccountingReportQuery,
  ): Promise<AccountingReportAggregates>;
}
