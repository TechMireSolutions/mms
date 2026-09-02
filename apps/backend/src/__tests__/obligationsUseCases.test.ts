import { describe, expect, it, vi } from 'vitest';
import { createObligationsUseCases } from '../obligations/use-cases/obligationsUseCases.js';
import type { ObligationsRepository } from '../obligations/repository/obligationsRepository.js';
import { runWithTenant } from '../lib/tenantContext.js';

function createFakeRepo(): ObligationsRepository {
  return {
    listObligationTypesByWorkspace: vi.fn().mockResolvedValue([]),
    bulkSaveObligationTypes: vi.fn().mockResolvedValue(undefined),
    replaceObligationTypesForWorkspace: vi.fn().mockResolvedValue(undefined),
    listMujtahidsByWorkspace: vi.fn().mockResolvedValue([]),
    bulkSaveMujtahids: vi.fn().mockResolvedValue(undefined),
    replaceMujtahidsForWorkspace: vi.fn().mockResolvedValue(undefined),
    listMujtahidRepsByWorkspace: vi.fn().mockResolvedValue([]),
    bulkSaveMujtahidReps: vi.fn().mockResolvedValue(undefined),
    replaceMujtahidRepsForWorkspace: vi.fn().mockResolvedValue(undefined),
    listWakalaTypesByWorkspace: vi.fn().mockResolvedValue([]),
    bulkSaveWakalaTypes: vi.fn().mockResolvedValue(undefined),
    replaceWakalaTypesForWorkspace: vi.fn().mockResolvedValue(undefined),
    listObligationDistributionsByWorkspace: vi.fn().mockResolvedValue([]),
    bulkSaveObligationDistributions: vi.fn().mockResolvedValue(undefined),
    replaceObligationDistributionsForWorkspace: vi.fn().mockResolvedValue(undefined),
    listObligationCollectionsByWorkspace: vi.fn().mockResolvedValue([]),
    findObligationCollectionById: vi.fn().mockResolvedValue(null),
    saveObligationCollection: vi.fn().mockResolvedValue(undefined),
    bulkSaveObligationCollections: vi.fn().mockResolvedValue(undefined),
    replaceObligationCollectionsForWorkspace: vi.fn().mockResolvedValue(undefined),
    aggregateObligationsCommandMetrics: vi.fn().mockResolvedValue({
      total: 5,
      totalAmount: 100,
      cash: 60,
      online: 40,
      newThisPeriod: 2,
      obligationTypes: 3,
    }),
    aggregateObligationsReport: vi.fn().mockResolvedValue({
      totalCollections: 0,
      totalAmount: 0,
      uniqueReps: 0,
      typeBreakdown: [],
      monthlyTrend: [],
      wakalaSummary: [],
      repSummary: [],
    }),
  };
}

describe('obligations use-cases (DI with fake repository)', () => {
  it('loadObligationCollections delegates to the injected repository', async () => {
    const repo = createFakeRepo();
    const useCases = createObligationsUseCases(repo);

    const result = await runWithTenant('demo', () => useCases.loadObligationCollections());

    expect(result).toEqual([]);
  });

  it('loadObligationsCommandMetrics delegates to the injected repository with the active tenant', async () => {
    const repo = createFakeRepo();
    const useCases = createObligationsUseCases(repo);

    const result = await runWithTenant('demo', () => useCases.loadObligationsCommandMetrics());

    expect(result.total).toBe(5);
    expect(repo.aggregateObligationsCommandMetrics).toHaveBeenCalledWith('demo');
  });

  it('returns empty defaults when no tenant context is bound', async () => {
    const repo = createFakeRepo();
    const useCases = createObligationsUseCases(repo);

    const metrics = await useCases.loadObligationsCommandMetrics();

    expect(metrics.total).toBe(0);
    expect(repo.aggregateObligationsCommandMetrics).not.toHaveBeenCalled();
  });
});
