import type { HasanatRepository } from '../repository/hasanatRepository.js';
import { hasanatRepository } from '../repository/hasanatRepositoryAdapter.js';
import { getRequestTenant } from '../../lib/tenantContext.js';
import { createGenericRelationalService } from '../../services/genericRelationalService.js';
import {
  defineTenantBulkCollectionService,
  scopeDeleted,
  upsertWithBroadcast,
} from '../../services/tenantBulkService.js';
import {
  type Denomination,
  type StockBatch,
  type Distribution,
  type Redemption,
  type HasanatCommandMetricsSnapshot,
  type HasanatReportComparisonQuery,
  type HasanatListQuery,
  denomListSchema,
  batchListSchema,
  distributionListSchema,
  redemptionListSchema,
  distributionRecordSchema,
  normalizeHasanatReportComparisonQuery,
} from '@mms/shared';

const EMPTY_HASANAT_METRICS: HasanatCommandMetricsSnapshot = {
  totalStock: 0,
  available: 0,
  distributed: 0,
  redeemed: 0,
  active: 0,
  returned: 0,
  denominations: 0,
  totalPointsDistributed: 0,
  pointsThisWeek: 0,
  pointsLastWeek: 0,
};

/**
 * Hasanat use-cases — composition root binding a {@link HasanatRepository} to
 * every operation. Production uses the default Drizzle-backed `hasanatUseCases`;
 * tests can pass a fake repository to exercise orchestration in isolation.
 */
export function createHasanatUseCases(repo: HasanatRepository = hasanatRepository) {
  const denomService = defineTenantBulkCollectionService<Denomination>(
    { listByWorkspace: repo.listDenomsByWorkspace, replaceForWorkspace: repo.replaceDenomsForWorkspace },
    denomListSchema,
    'hasanat_denoms',
  );

  const batchService = defineTenantBulkCollectionService<StockBatch>(
    { listByWorkspace: repo.listBatchesByWorkspace, replaceForWorkspace: repo.replaceBatchesForWorkspace },
    batchListSchema,
    'hasanat_batches',
  );

  const distributionBulkService = defineTenantBulkCollectionService<Distribution>(
    { listByWorkspace: repo.listDistributionsByWorkspace, replaceForWorkspace: repo.replaceDistributionsForWorkspace },
    distributionListSchema,
    'hasanat_distributions',
  );

  const redemptionService = defineTenantBulkCollectionService<Redemption>(
    { listByWorkspace: repo.listRedemptionsByWorkspace, replaceForWorkspace: repo.replaceRedemptionsForWorkspace },
    redemptionListSchema,
    'hasanat_redemptions',
  );

  const distributionCrud = createGenericRelationalService<Distribution>({
    repo: {
      listByWorkspace: repo.listDistributionsByWorkspace,
      findById: repo.findDistributionById,
      save: repo.saveDistribution,
    },
    schema: distributionRecordSchema,
    websocketCollection: 'hasanat_distributions',
    idPrefix: 'hd',
  });

  return {
    loadDenoms: denomService.load,
    replaceDenoms: denomService.replace,
    loadBatches: batchService.load,
    replaceBatches: batchService.replace,
    replaceDistributions: distributionBulkService.replace,
    loadRedemptions: redemptionService.load,
    replaceRedemptions: redemptionService.replace,

    loadDistributions: async (options?: { includeDeleted?: boolean }): Promise<Distribution[]> => {
      const rows = await distributionCrud.loadAll({ includeDeleted: true });
      return scopeDeleted(rows, options?.includeDeleted);
    },

    loadDistributionsPage: async (query: HasanatListQuery & { includeDeleted?: boolean }) => {
      const tenant = getRequestTenant();
      if (!tenant) {
        return {
          distributions: [],
          total: 0,
          page: query.page ?? 1,
          limit: query.limit ?? 15,
          hasMore: false,
        };
      }
      return repo.listDistributionsPage(tenant, query);
    },

    upsertDenoms: (records: Denomination[]) =>
      upsertWithBroadcast(denomListSchema, records, repo.bulkSaveDenoms, 'hasanat_denoms'),
    upsertBatches: (records: StockBatch[]) =>
      upsertWithBroadcast(batchListSchema, records, repo.bulkSaveBatches, 'hasanat_batches'),
    upsertDistributions: (records: Distribution[]) =>
      upsertWithBroadcast(distributionListSchema, records, repo.bulkSaveDistributions, 'hasanat_distributions'),
    upsertRedemptions: (records: Redemption[]) =>
      upsertWithBroadcast(redemptionListSchema, records, repo.bulkSaveRedemptions, 'hasanat_redemptions'),

    deleteDistributionById: distributionCrud.deleteById,
    createDistribution: distributionCrud.create,
    updateDistributionById: distributionCrud.updateById,
    restoreDistributionById: distributionCrud.restoreById,
    bulkSoftDeleteDistributions: distributionCrud.bulkDeleteByIds,
    bulkRestoreDistributions: distributionCrud.bulkRestoreByIds,

    loadHasanatReportAggregates: async (comparisonQuery?: HasanatReportComparisonQuery) => {
      const tenant = getRequestTenant();
      if (!tenant) {
        return { comparison: { sessions: [], monthly: { a: [], b: [] } } };
      }
      const normalized = normalizeHasanatReportComparisonQuery(comparisonQuery);
      return repo.loadHasanatReportAggregates(tenant, normalized);
    },

    loadHasanatCommandMetrics: async (): Promise<HasanatCommandMetricsSnapshot> => {
      const tenant = getRequestTenant();
      if (!tenant) return EMPTY_HASANAT_METRICS;
      return repo.aggregateHasanatCommandMetrics(tenant);
    },

    loadHasanatWidgetAggregates: async (
      queries: import('@mms/shared').WidgetQuery[],
    ): Promise<Record<string, import('@mms/shared').WidgetAggregateResult>> => {
      const tenant = getRequestTenant();
      if (!tenant) return {};
      return repo.aggregateHasanatWidgetQueries(tenant, queries);
    },
  };
}

export const hasanatUseCases = createHasanatUseCases();
