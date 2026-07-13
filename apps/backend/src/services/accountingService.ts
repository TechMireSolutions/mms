import {
  type Account,
  type JournalEntry,
  type FiscalYear,
  accountListSchema,
  journalEntryListSchema,
  fiscalYearListSchema,
} from '@mms/shared';
import {
  listAccountsByWorkspace,
  replaceAccountsForWorkspace,
  listEntriesByWorkspace,
  replaceEntriesForWorkspace,
  listFiscalYearsByWorkspace,
  replaceFiscalYearsForWorkspace,
} from '../db/repositories/accountingRepository.js';
import { defineTenantBulkCollectionService } from './tenantBulkService.js';

const accountService = defineTenantBulkCollectionService<Account>(
  { listByWorkspace: listAccountsByWorkspace, replaceForWorkspace: replaceAccountsForWorkspace },
  accountListSchema,
  'accounting_accounts',
);
export const loadAccounts = accountService.load;
export const replaceAccounts = accountService.replace;

const entryService = defineTenantBulkCollectionService<JournalEntry>(
  { listByWorkspace: listEntriesByWorkspace, replaceForWorkspace: replaceEntriesForWorkspace },
  journalEntryListSchema,
  'accounting_entries',
);
export const loadEntries = entryService.load;
export const replaceEntries = entryService.replace;

const fiscalYearService = defineTenantBulkCollectionService<FiscalYear>(
  { listByWorkspace: listFiscalYearsByWorkspace, replaceForWorkspace: replaceFiscalYearsForWorkspace },
  fiscalYearListSchema,
  'accounting_fiscal_years',
);
export const loadFiscalYears = fiscalYearService.load;
export const replaceFiscalYears = fiscalYearService.replace;
