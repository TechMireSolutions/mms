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
  listAccountsByWorkspace(tenant: string): Promise<Account[]>;
  findAccountById(tenant: string, id: string): Promise<Account | null>;
  saveAccount(tenant: string, record: Account): Promise<void>;
  bulkSaveAccounts(tenant: string, records: Account[]): Promise<void>;
  replaceAccountsForWorkspace(tenant: string, records: Account[]): Promise<void>;
  listAccountsPage(tenant: string, query: AccountingListQuery): Promise<AccountingAccountsListPageResult>;

  // Journal entries
  listEntriesByWorkspace(tenant: string): Promise<JournalEntry[]>;
  findEntryById(tenant: string, id: string): Promise<JournalEntry | null>;
  saveEntry(tenant: string, record: JournalEntry): Promise<void>;
  bulkSaveEntries(tenant: string, records: JournalEntry[]): Promise<void>;
  replaceEntriesForWorkspace(tenant: string, records: JournalEntry[]): Promise<void>;
  listEntriesPage(tenant: string, query: AccountingListQuery): Promise<AccountingEntriesListPageResult>;

  // Fiscal years
  listFiscalYearsByWorkspace(tenant: string): Promise<FiscalYear[]>;
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
