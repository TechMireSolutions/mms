import type { HasanatRepository } from './hasanatRepository.js';
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
} from '../../db/repositories/hasanatRepository.js';
import {
  listDistributionsPage,
  aggregateHasanatCommandMetrics,
} from '../../db/repositories/hasanatRepositoryList.js';
import { loadHasanatReportAggregatesSql } from '../../db/repositories/hasanatRepositoryReport.js';
import { aggregateHasanatWidgetQueries } from '../../db/repositories/hasanatRepositoryWidgets.js';

/**
 * Drizzle-backed adapter for {@link HasanatRepository}. Delegates to the
 * existing concrete repository functions (no SQL rewrite in this pass).
 */
export const hasanatRepository: HasanatRepository = {
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
  listDistributionsPage,
  listRedemptionsByWorkspace,
  bulkSaveRedemptions,
  replaceRedemptionsForWorkspace,
  aggregateHasanatCommandMetrics,
  aggregateHasanatWidgetQueries,
  loadHasanatReportAggregates: loadHasanatReportAggregatesSql,
};
