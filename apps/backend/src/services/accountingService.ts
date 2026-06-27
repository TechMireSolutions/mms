import {
  type Account,
  type JournalEntry,
  type FiscalYear,
  accountListSchema,
  accountRecordSchema,
  journalEntryListSchema,
  journalEntryRecordSchema,
  fiscalYearListSchema,
  fiscalYearRecordSchema,
} from '@mms/shared';
import { defineCollectionCrudService } from './collectionCrudService.js';
import { persistCollection } from './dbSyncService.js';

const ACCOUNTS_COLLECTION = 'accounting_accounts';
const ENTRIES_COLLECTION = 'accounting_entries';
const FISCAL_YEARS_COLLECTION = 'accounting_fiscal_years';

// --- Accounts ---
const normalizeAccount = (record: Account) => accountRecordSchema.parse(record);
const accountCrud = defineCollectionCrudService(ACCOUNTS_COLLECTION, accountListSchema, normalizeAccount);
export const loadAccounts = accountCrud.load;
export async function replaceAccounts(records: Account[]): Promise<Account[]> {
  const parsed = accountListSchema.parse(records);
  await persistCollection(ACCOUNTS_COLLECTION, parsed);
  return parsed;
}

// --- Entries ---
const normalizeEntry = (record: JournalEntry) => journalEntryRecordSchema.parse(record);
const entryCrud = defineCollectionCrudService(ENTRIES_COLLECTION, journalEntryListSchema, normalizeEntry);
export const loadEntries = entryCrud.load;
export async function replaceEntries(records: JournalEntry[]): Promise<JournalEntry[]> {
  const parsed = journalEntryListSchema.parse(records);
  await persistCollection(ENTRIES_COLLECTION, parsed);
  return parsed;
}

// --- Fiscal Years ---
const normalizeFiscalYear = (record: FiscalYear) => fiscalYearRecordSchema.parse(record);
const fiscalYearCrud = defineCollectionCrudService(FISCAL_YEARS_COLLECTION, fiscalYearListSchema, normalizeFiscalYear);
export const loadFiscalYears = fiscalYearCrud.load;
export async function replaceFiscalYears(records: FiscalYear[]): Promise<FiscalYear[]> {
  const parsed = fiscalYearListSchema.parse(records);
  await persistCollection(FISCAL_YEARS_COLLECTION, parsed);
  return parsed;
}
