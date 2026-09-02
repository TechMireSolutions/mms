import { describe, expect, it, vi } from 'vitest';
import { createAccountingUseCases } from '../accounting/use-cases/accountingUseCases.js';
import type { AccountingRepository } from '../accounting/repository/accountingRepository.js';
import { runWithTenant } from '../lib/tenantContext.js';

function createFakeRepo(): AccountingRepository {
  return {
    listAccountsByWorkspace: vi.fn().mockResolvedValue([]),
    findAccountById: vi.fn().mockResolvedValue(null),
    saveAccount: vi.fn().mockResolvedValue(undefined),
    bulkSaveAccounts: vi.fn().mockResolvedValue(undefined),
    replaceAccountsForWorkspace: vi.fn().mockResolvedValue(undefined),
    listAccountsPage: vi.fn().mockResolvedValue({
      accounts: [],
      total: 0,
      page: 1,
      limit: 12,
      hasMore: false,
    }),
    listEntriesByWorkspace: vi.fn().mockResolvedValue([]),
    findEntryById: vi.fn().mockResolvedValue(null),
    saveEntry: vi.fn().mockResolvedValue(undefined),
    bulkSaveEntries: vi.fn().mockResolvedValue(undefined),
    replaceEntriesForWorkspace: vi.fn().mockResolvedValue(undefined),
    listEntriesPage: vi.fn().mockResolvedValue({
      entries: [],
      total: 0,
      page: 1,
      limit: 12,
      hasMore: false,
    }),
    listFiscalYearsByWorkspace: vi.fn().mockResolvedValue([]),
    bulkSaveFiscalYears: vi.fn().mockResolvedValue(undefined),
    replaceFiscalYearsForWorkspace: vi.fn().mockResolvedValue(undefined),
    listFiscalYearsPage: vi.fn().mockResolvedValue({
      fiscalYears: [],
      total: 0,
      page: 1,
      limit: 12,
      hasMore: false,
    }),
    aggregateAccountingCommandMetrics: vi.fn().mockResolvedValue({
      totalEntries: 4,
      posted: 3,
      draft: 1,
      activeAccounts: 2,
      inactiveAccounts: 0,
      newThisPeriod: 1,
      postedVolume: 100,
      revenue: 60,
      expenses: 40,
      surplus: 20,
      assets: 0,
      liabilities: 0,
    }),
    aggregateAccountingReport: vi.fn().mockResolvedValue({}),
  };
}

describe('accounting use-cases (DI with fake repository)', () => {
  it('loadAccountsPage delegates to the injected repository with the active tenant', async () => {
    const repo = createFakeRepo();
    const useCases = createAccountingUseCases(repo);

    const result = await runWithTenant('demo', () => useCases.loadAccountsPage({ page: 2, limit: 12 }));

    expect(result).toEqual({ accounts: [], total: 0, page: 1, limit: 12, hasMore: false });
    expect(repo.listAccountsPage).toHaveBeenCalledWith('demo', { page: 2, limit: 12 });
  });

  it('loadAccountingCommandMetrics delegates to the injected repository', async () => {
    const repo = createFakeRepo();
    const useCases = createAccountingUseCases(repo);

    const result = await runWithTenant('demo', () => useCases.loadAccountingCommandMetrics());

    expect(result.totalEntries).toBe(4);
    expect(repo.aggregateAccountingCommandMetrics).toHaveBeenCalledWith('demo');
  });

  it('returns empty defaults when no tenant context is bound', async () => {
    const repo = createFakeRepo();
    const useCases = createAccountingUseCases(repo);

    const page = await useCases.loadAccountsPage({ page: 1, limit: 12 });
    const metrics = await useCases.loadAccountingCommandMetrics();

    expect(page).toEqual({ accounts: [], total: 0, page: 1, limit: 12, hasMore: false });
    expect(metrics.totalEntries).toBe(0);
    expect(repo.listAccountsPage).not.toHaveBeenCalled();
    expect(repo.aggregateAccountingCommandMetrics).not.toHaveBeenCalled();
  });
});
