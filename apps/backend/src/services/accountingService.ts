import { accountingUseCases } from '../accounting/use-cases/accountingUseCases.js';

/**
 * Thin re-export of the accounting use-cases facade.
 *
 * Kept for backward compatibility with existing importers (report routes,
 * dashboard summary, tests). New code should depend on
 * `accounting/use-cases/accountingUseCases.js` directly.
 */
export const replaceAccounts = accountingUseCases.replaceAccounts;
export const replaceEntries = accountingUseCases.replaceEntries;
export const replaceFiscalYears = accountingUseCases.replaceFiscalYears;
export const loadAccounts = accountingUseCases.loadAccounts;
export const loadEntries = accountingUseCases.loadEntries;
export const loadFiscalYears = accountingUseCases.loadFiscalYears;
export const upsertAccounts = accountingUseCases.upsertAccounts;
export const upsertEntries = accountingUseCases.upsertEntries;
export const upsertFiscalYears = accountingUseCases.upsertFiscalYears;
export const createJournalEntry = accountingUseCases.createJournalEntry;
export const updateJournalEntryById = accountingUseCases.updateJournalEntryById;
export const restoreJournalEntryById = accountingUseCases.restoreJournalEntryById;
export const bulkRestoreJournalEntries = accountingUseCases.bulkRestoreJournalEntries;
export const deleteJournalEntryById = accountingUseCases.deleteJournalEntryById;
export const bulkSoftDeleteJournalEntries = accountingUseCases.bulkSoftDeleteJournalEntries;
export const deleteAccountById = accountingUseCases.deleteAccountById;
export const restoreAccountById = accountingUseCases.restoreAccountById;
export const bulkSoftDeleteAccounts = accountingUseCases.bulkSoftDeleteAccounts;
export const bulkRestoreAccounts = accountingUseCases.bulkRestoreAccounts;
export const loadAccountsPage = accountingUseCases.loadAccountsPage;
export const loadEntriesPage = accountingUseCases.loadEntriesPage;
export const loadFiscalYearsPage = accountingUseCases.loadFiscalYearsPage;
export const loadAccountingCommandMetrics = accountingUseCases.loadAccountingCommandMetrics;
export const loadAccountingReportAggregates = accountingUseCases.loadAccountingReportAggregates;
