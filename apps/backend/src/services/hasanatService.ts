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
import { listDistributionsPage, aggregateHasanatCommandMetrics } from '../db/repositories/hasanatRepositoryList.js';
import {
  listDenomsByWorkspace,
  bulkSaveDenoms,
  replaceDenomsForWorkspace,
  listBatchesByWorkspace,
  bulkSaveBatches,
  replaceBatchesForWorkspace,
  listDistributionsByWorkspace,
  findDistributionById,
  saveDistribution,
  bulkSaveDistributions,
  replaceDistributionsForWorkspace,
  listRedemptionsByWorkspace,
  bulkSaveRedemptions,
  replaceRedemptionsForWorkspace,
} from '../db/repositories/hasanatRepository.js';
import { loadHasanatReportAggregatesSql } from '../db/repositories/hasanatRepositoryReport.js';
import { aggregateHasanatWidgetQueries } from '../db/repositories/hasanatRepositoryWidgets.js';
import {
  defineTenantBulkCollectionService,
  scopeDeleted,
  upsertWithBroadcast,
} from './tenantBulkService.js';
import { createGenericRelationalService } from './genericRelationalService.js';
import { getRequestTenant } from '../lib/tenantContext.js';

const denomService = defineTenantBulkCollectionService<Denomination>(
  { listByWorkspace: listDenomsByWorkspace, replaceForWorkspace: replaceDenomsForWorkspace },
  denomListSchema,
  'hasanat_denoms',
);
export const loadDenoms = denomService.load;
export const replaceDenoms = denomService.replace;

const batchService = defineTenantBulkCollectionService<StockBatch>(
  { listByWorkspace: listBatchesByWorkspace, replaceForWorkspace: replaceBatchesForWorkspace },
  batchListSchema,
  'hasanat_batches',
);
export const loadBatches = batchService.load;
export const replaceBatches = batchService.replace;

const distributionBulkService = defineTenantBulkCollectionService<Distribution>(
  { listByWorkspace: listDistributionsByWorkspace, replaceForWorkspace: replaceDistributionsForWorkspace },
  distributionListSchema,
  'hasanat_distributions',
);
export const replaceDistributions = distributionBulkService.replace;

const redemptionService = defineTenantBulkCollectionService<Redemption>(
  { listByWorkspace: listRedemptionsByWorkspace, replaceForWorkspace: replaceRedemptionsForWorkspace },
  redemptionListSchema,
  'hasanat_redemptions',
);
export const loadRedemptions = redemptionService.load;
export const replaceRedemptions = redemptionService.replace;

const distributionCrud = createGenericRelationalService<Distribution>({
  repo: {
    listByWorkspace: listDistributionsByWorkspace,
    findById: findDistributionById,
    save: saveDistribution,
  },
  schema: distributionRecordSchema,
  websocketCollection: 'hasanat_distributions',
  idPrefix: 'hd',
});

export async function loadDistributions(options?: {
  includeDeleted?: boolean;
}): Promise<Distribution[]> {
  const rows = await distributionCrud.loadAll({ includeDeleted: true });
  return scopeDeleted(rows, options?.includeDeleted);
}

/** SQL-paged distributions Work list (server-side search/status/soft-delete). */
export async function loadDistributionsPage(
  query: HasanatListQuery & { includeDeleted?: boolean },
): Promise<{
  distributions: Distribution[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}> {
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
  return listDistributionsPage(tenant, query);
}

export const upsertDenoms = (records: Denomination[]) =>
  upsertWithBroadcast(denomListSchema, records, bulkSaveDenoms, 'hasanat_denoms');

export const upsertBatches = (records: StockBatch[]) =>
  upsertWithBroadcast(batchListSchema, records, bulkSaveBatches, 'hasanat_batches');

export const upsertDistributions = (records: Distribution[]) =>
  upsertWithBroadcast(
    distributionListSchema,
    records,
    bulkSaveDistributions,
    'hasanat_distributions',
  );

export const upsertRedemptions = (records: Redemption[]) =>
  upsertWithBroadcast(redemptionListSchema, records, bulkSaveRedemptions, 'hasanat_redemptions');

export const deleteDistributionById = distributionCrud.deleteById;
export const restoreDistributionById = distributionCrud.restoreById;
export const bulkSoftDeleteDistributions = distributionCrud.bulkDeleteByIds;
export const bulkRestoreDistributions = distributionCrud.bulkRestoreByIds;

/** ComparisonMode hasanat SQL aggregates (session points + dual monthly ranges). */
export async function loadHasanatReportAggregates(
  comparisonQuery?: HasanatReportComparisonQuery,
) {
  const tenant = getRequestTenant();
  if (!tenant) {
    return { comparison: { sessions: [], monthly: { a: [], b: [] } } };
  }
  const normalized = normalizeHasanatReportComparisonQuery(comparisonQuery);
  return loadHasanatReportAggregatesSql(tenant, normalized);
}

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

/** Command-centre hasanat metrics via SQL aggregates (no full-row load). */
export async function loadHasanatCommandMetrics(): Promise<HasanatCommandMetricsSnapshot> {
  const tenant = getRequestTenant();
  if (!tenant) return EMPTY_HASANAT_METRICS;
  return aggregateHasanatCommandMetrics(tenant);
}

export async function loadHasanatWidgetAggregates(
  queries: import('@mms/shared').WidgetQuery[],
): Promise<Record<string, import('@mms/shared').WidgetAggregateResult>> {
  const tenant = getRequestTenant();
  if (!tenant) return {};
  return aggregateHasanatWidgetQueries(tenant, queries);
}
