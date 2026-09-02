import type { AccountingRepository } from './accountingRepository.js';
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
} from '../../db/repositories/accountingRepository.js';
import {
  listAccountsPage,
  listFiscalYearsPage,
} from '../../db/repositories/accountingRepositoryListPages.js';
import { listEntriesPage } from '../../db/repositories/accountingRepositoryListEntries.js';
import { aggregateAccountingCommandMetrics } from '../../db/repositories/accountingRepositoryMetrics.js';
import { aggregateAccountingReport } from '../../db/repositories/accountingRepositoryReport.js';

/**
 * Drizzle-backed adapter for {@link AccountingRepository}. Delegates to the
 * existing concrete repository functions (no SQL rewrite in this pass).
 */
export const accountingRepository: AccountingRepository = {
  listAccountsByWorkspace,
  findAccountById,
  saveAccount,
  bulkSaveAccounts,
  replaceAccountsForWorkspace,
  listAccountsPage,
  listEntriesByWorkspace,
  findEntryById,
  saveEntry,
  bulkSaveEntries,
  replaceEntriesForWorkspace,
  listEntriesPage,
  listFiscalYearsByWorkspace,
  bulkSaveFiscalYears,
  replaceFiscalYearsForWorkspace,
  listFiscalYearsPage,
  aggregateAccountingCommandMetrics,
  aggregateAccountingReport,
};
