import { describe, expect, it, vi } from 'vitest';
import { createHasanatUseCases } from '../hasanat/use-cases/hasanatUseCases.js';
import type { HasanatRepository } from '../hasanat/repository/hasanatRepository.js';
import { runWithTenant } from '../lib/tenantContext.js';

function createFakeRepo(): HasanatRepository {
  return {
    listDenomsByWorkspace: vi.fn().mockResolvedValue([]),
    bulkSaveDenoms: vi.fn().mockResolvedValue(undefined),
    replaceDenomsForWorkspace: vi.fn().mockResolvedValue(undefined),
    listBatchesByWorkspace: vi.fn().mockResolvedValue([]),
    bulkSaveBatches: vi.fn().mockResolvedValue(undefined),
    replaceBatchesForWorkspace: vi.fn().mockResolvedValue(undefined),
    listDistributionsByWorkspace: vi.fn().mockResolvedValue([]),
    findDistributionById: vi.fn().mockResolvedValue(null),
    saveDistribution: vi.fn().mockResolvedValue(undefined),
    bulkSaveDistributions: vi.fn().mockResolvedValue(undefined),
    replaceDistributionsForWorkspace: vi.fn().mockResolvedValue(undefined),
    listDistributionsPage: vi.fn().mockResolvedValue({
      distributions: [],
      total: 0,
      page: 1,
      limit: 15,
      hasMore: false,
    }),
    listRedemptionsByWorkspace: vi.fn().mockResolvedValue([]),
    bulkSaveRedemptions: vi.fn().mockResolvedValue(undefined),
    replaceRedemptionsForWorkspace: vi.fn().mockResolvedValue(undefined),
    aggregateHasanatCommandMetrics: vi.fn().mockResolvedValue({
      totalStock: 10,
      available: 6,
      distributed: 3,
      redeemed: 1,
      active: 2,
      returned: 0,
      denominations: 4,
      totalPointsDistributed: 0,
      pointsThisWeek: 0,
      pointsLastWeek: 0,
    }),
    aggregateHasanatWidgetQueries: vi.fn().mockResolvedValue({}),
    loadHasanatReportAggregates: vi.fn().mockResolvedValue({
      comparison: { sessions: [], monthly: { a: [], b: [] } },
    }),
  };
}

describe('hasanat use-cases (DI with fake repository)', () => {
  it('loadDistributionsPage delegates to the injected repository with the active tenant', async () => {
    const repo = createFakeRepo();
    const useCases = createHasanatUseCases(repo);

    const result = await runWithTenant('demo', () => useCases.loadDistributionsPage({ page: 2, limit: 15 }));

    expect(result).toEqual({ distributions: [], total: 0, page: 1, limit: 15, hasMore: false });
    expect(repo.listDistributionsPage).toHaveBeenCalledWith('demo', { page: 2, limit: 15 });
  });

  it('loadHasanatCommandMetrics delegates to the injected repository', async () => {
    const repo = createFakeRepo();
    const useCases = createHasanatUseCases(repo);

    const result = await runWithTenant('demo', () => useCases.loadHasanatCommandMetrics());

    expect(result.totalStock).toBe(10);
    expect(repo.aggregateHasanatCommandMetrics).toHaveBeenCalledWith('demo');
  });

  it('upsertDenoms delegates to the injected repository', async () => {
    const repo = createFakeRepo();
    const useCases = createHasanatUseCases(repo);
    const denom = {
      id: 'd-1',
      name: 'Star',
      points: 5,
      color: 'emerald',
      description: '',
      icon: 'Star',
      active: true,
    };

    const result = await runWithTenant('demo', () => useCases.upsertDenoms([denom]));

    expect(result).toEqual([denom]);
    expect(repo.bulkSaveDenoms).toHaveBeenCalledWith('demo', [denom]);
  });

  it('returns empty defaults when no tenant context is bound', async () => {
    const repo = createFakeRepo();
    const useCases = createHasanatUseCases(repo);

    const page = await useCases.loadDistributionsPage({ page: 1, limit: 15 });
    const metrics = await useCases.loadHasanatCommandMetrics();

    expect(page).toEqual({ distributions: [], total: 0, page: 1, limit: 15, hasMore: false });
    expect(metrics.totalStock).toBe(0);
    expect(repo.listDistributionsPage).not.toHaveBeenCalled();
    expect(repo.aggregateHasanatCommandMetrics).not.toHaveBeenCalled();
  });
});
