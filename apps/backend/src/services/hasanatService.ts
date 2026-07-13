import {
  type Denomination,
  type StockBatch,
  type Distribution,
  type Redemption,
  denomListSchema,
  batchListSchema,
  distributionListSchema,
  redemptionListSchema,
} from '@mms/shared';
import {
  listDenomsByWorkspace,
  replaceDenomsForWorkspace,
  listBatchesByWorkspace,
  replaceBatchesForWorkspace,
  listDistributionsByWorkspace,
  replaceDistributionsForWorkspace,
  listRedemptionsByWorkspace,
  replaceRedemptionsForWorkspace,
} from '../db/repositories/hasanatRepository.js';
import { defineTenantBulkCollectionService } from './tenantBulkService.js';

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

const distributionService = defineTenantBulkCollectionService<Distribution>(
  { listByWorkspace: listDistributionsByWorkspace, replaceForWorkspace: replaceDistributionsForWorkspace },
  distributionListSchema,
  'hasanat_distributions',
);
export const loadDistributions = distributionService.load;
export const replaceDistributions = distributionService.replace;

const redemptionService = defineTenantBulkCollectionService<Redemption>(
  { listByWorkspace: listRedemptionsByWorkspace, replaceForWorkspace: replaceRedemptionsForWorkspace },
  redemptionListSchema,
  'hasanat_redemptions',
);
export const loadRedemptions = redemptionService.load;
export const replaceRedemptions = redemptionService.replace;
