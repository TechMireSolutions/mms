import { type Account, type JournalEntry, type FiscalYear } from '@mms/shared';
import {
  accountingAccounts,
  accountingEntries,
  accountingFiscalYears,
} from '../schema.js';
import { createGenericRepository } from './genericRepository.js';

const accountsRepo = createGenericRepository<Account, typeof accountingAccounts>(accountingAccounts, {
  conflictTarget: [accountingAccounts.workspaceSubdomain, accountingAccounts.id],
});
const entriesRepo = createGenericRepository<JournalEntry, typeof accountingEntries>(accountingEntries, {
  conflictTarget: [accountingEntries.workspaceSubdomain, accountingEntries.id],
});
const fiscalYearsRepo = createGenericRepository<FiscalYear, typeof accountingFiscalYears>(
  accountingFiscalYears,
  {
    conflictTarget: [accountingFiscalYears.workspaceSubdomain, accountingFiscalYears.id],
  },
);

export const listAccountsByWorkspace = accountsRepo.listByWorkspace;
export const findAccountById = accountsRepo.findById;
export const saveAccount = accountsRepo.save;
export const bulkSaveAccounts = accountsRepo.bulkSave;
export const replaceAccountsForWorkspace = accountsRepo.replaceForWorkspace;

export const listEntriesByWorkspace = entriesRepo.listByWorkspace;
export const findEntryById = entriesRepo.findById;
export const saveEntry = entriesRepo.save;
export const bulkSaveEntries = entriesRepo.bulkSave;
export const replaceEntriesForWorkspace = entriesRepo.replaceForWorkspace;

export const listFiscalYearsByWorkspace = fiscalYearsRepo.listByWorkspace;
export const findFiscalYearById = fiscalYearsRepo.findById;
export const saveFiscalYear = fiscalYearsRepo.save;
export const bulkSaveFiscalYears = fiscalYearsRepo.bulkSave;
export const replaceFiscalYearsForWorkspace = fiscalYearsRepo.replaceForWorkspace;

export async function deleteAccountingByWorkspace(workspaceSubdomain: string): Promise<void> {
  await accountsRepo.deleteByWorkspace(workspaceSubdomain);
  await entriesRepo.deleteByWorkspace(workspaceSubdomain);
  await fiscalYearsRepo.deleteByWorkspace(workspaceSubdomain);
}
