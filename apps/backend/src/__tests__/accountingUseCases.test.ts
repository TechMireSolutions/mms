import { describe, expect, it, vi } from 'vitest';
import { createAccountingUseCases } from '../accounting/use-cases/accountingUseCases.js';
import type { AccountingRepository } from '../accounting/repository/accountingRepository.js';
import { runWithTenant } from '../lib/tenantContext.js';

function createFakeRepo(): AccountingRepository {
  return {
    listAccountsByWorkspace: vi.fn().mockResolvedValue([]),
    findAccountById: vi.fn().mockResolvedValue(null),
    findAccountsByIds: vi.fn().mockResolvedValue([]),
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
    findEntriesByIds: vi.fn().mockResolvedValue([]),
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
    findFiscalYearById: vi.fn().mockResolvedValue(null),
    findFiscalYearsByIds: vi.fn().mockResolvedValue([]),
    saveFiscalYear: vi.fn().mockResolvedValue(undefined),
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

  it('loadAccountById and loadAccountsByIds delegate with soft-delete filtering', async () => {
    const activeAccount = {
      id: 'acc_1',
      code: '1000',
      name: 'Cash',
      type: 'Asset' as const,
      subtype: 'Current',
      description: '',
      isActive: true,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    };
    const deletedAccount = {
      ...activeAccount,
      id: 'acc_2',
      deletedAt: '2026-01-02T00:00:00.000Z',
    };

    const repo = createFakeRepo();
    vi.mocked(repo.findAccountById).mockResolvedValue(deletedAccount);
    vi.mocked(repo.findAccountsByIds).mockResolvedValue([activeAccount, deletedAccount]);
    const useCases = createAccountingUseCases(repo);

    await runWithTenant('demo', async () => {
      // Excludes deleted by default
      const res1 = await useCases.loadAccountById('acc_2');
      expect(res1).toBeNull();

      // Includes deleted when requested
      const res2 = await useCases.loadAccountById('acc_2', true);
      expect(res2?.id).toBe('acc_2');

      // Batch lookups with deduplication and filtering
      const batchRes = await useCases.loadAccountsByIds(['acc_1', 'acc_2', 'acc_1 ']);
      expect(batchRes).toHaveLength(1);
      expect(batchRes[0]?.id).toBe('acc_1');

      const batchArchived = await useCases.loadAccountsByIds(['acc_1', 'acc_2'], true);
      expect(batchArchived).toHaveLength(1);
      expect(batchArchived[0]?.id).toBe('acc_2');
    });
  });

  it('loadEntryById and loadEntriesByIds delegate with soft-delete filtering', async () => {
    const activeEntry = {
      id: 'je_1',
      date: '2026-01-01',
      ref: 'REF-1',
      description: 'Test entry',
      status: 'posted' as const,
      created_by: 'admin',
      fiscal_year: '2026',
      simple_mode: false,
      lines: [],
      tags: [],
      attachments: [],
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    };
    const deletedEntry = {
      ...activeEntry,
      id: 'je_2',
      deletedAt: '2026-01-02T00:00:00.000Z',
    };

    const repo = createFakeRepo();
    vi.mocked(repo.findEntryById).mockResolvedValue(deletedEntry);
    vi.mocked(repo.findEntriesByIds).mockResolvedValue([activeEntry, deletedEntry]);
    const useCases = createAccountingUseCases(repo);

    await runWithTenant('demo', async () => {
      const res1 = await useCases.loadEntryById('je_2');
      expect(res1).toBeNull();

      const res2 = await useCases.loadEntryById('je_2', true);
      expect(res2?.id).toBe('je_2');

      const batchRes = await useCases.loadEntriesByIds(['je_1', 'je_2']);
      expect(batchRes).toHaveLength(1);
      expect(batchRes[0]?.id).toBe('je_1');
    });
  });

  it('loadFiscalYearById and loadFiscalYearsByIds delegate with soft-delete filtering', async () => {
    const activeYear = {
      id: 'fy_1',
      label: 'FY 2026',
      startDate: '2026-01-01',
      endDate: '2026-12-31',
      status: 'upcoming' as const,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    };
    const deletedYear = {
      ...activeYear,
      id: 'fy_2',
      deletedAt: '2026-01-02T00:00:00.000Z',
    };

    const repo = createFakeRepo();
    vi.mocked(repo.findFiscalYearById).mockResolvedValue(deletedYear);
    vi.mocked(repo.findFiscalYearsByIds).mockResolvedValue([activeYear, deletedYear]);
    const useCases = createAccountingUseCases(repo);

    await runWithTenant('demo', async () => {
      const res1 = await useCases.loadFiscalYearById('fy_2');
      expect(res1).toBeNull();

      const res2 = await useCases.loadFiscalYearById('fy_2', true);
      expect(res2?.id).toBe('fy_2');

      const batchRes = await useCases.loadFiscalYearsByIds(['fy_1', 'fy_2']);
      expect(batchRes).toHaveLength(1);
      expect(batchRes[0]?.id).toBe('fy_1');
    });
  });
});
