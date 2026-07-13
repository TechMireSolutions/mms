import { type Account, type JournalEntry, type FiscalYear } from '@mms/shared';
import {
  accountingAccounts,
  accountingEntries,
  accountingFiscalYears,
} from '../schema.js';
import { createGenericRepository } from './genericRepository.js';

const accountsRepo = createGenericRepository<Account, typeof accountingAccounts>(accountingAccounts);
const entriesRepo = createGenericRepository<JournalEntry, typeof accountingEntries>(accountingEntries);
const fiscalYearsRepo = createGenericRepository<FiscalYear, typeof accountingFiscalYears>(accountingFiscalYears);

export const listAccountsByWorkspace = accountsRepo.listByWorkspace;
export const replaceAccountsForWorkspace = accountsRepo.replaceForWorkspace;

export const listEntriesByWorkspace = entriesRepo.listByWorkspace;
export const replaceEntriesForWorkspace = entriesRepo.replaceForWorkspace;

export const listFiscalYearsByWorkspace = fiscalYearsRepo.listByWorkspace;
export const replaceFiscalYearsForWorkspace = fiscalYearsRepo.replaceForWorkspace;

export async function deleteAccountingByWorkspace(workspaceSubdomain: string): Promise<void> {
  await accountsRepo.deleteByWorkspace(workspaceSubdomain);
  await entriesRepo.deleteByWorkspace(workspaceSubdomain);
  await fiscalYearsRepo.deleteByWorkspace(workspaceSubdomain);
}
