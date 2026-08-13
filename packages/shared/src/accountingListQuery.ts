import type { Account, JournalEntry, FiscalYear } from './accountingModuleManifest.js';
import { paginateArray } from './utils.js';

export interface AccountingListQuery {
  page?: number;
  limit?: number;
  search?: string;
  sortField?: string;
  sortDir?: 'asc' | 'desc';
  includeDeleted?: boolean;
}

export interface AccountingAccountsListPageResult {
  accounts: Account[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface AccountingEntriesListPageResult {
  entries: JournalEntry[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface AccountingFiscalYearsListPageResult {
  fiscalYears: FiscalYear[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}
