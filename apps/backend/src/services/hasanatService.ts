import {
  type Denomination,
  type StockBatch,
  type Distribution,
  type Redemption,
  denomListSchema,
  batchListSchema,
  distributionListSchema,
  redemptionListSchema,
  distributionRecordSchema,
} from '@mms/shared';
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
import { defineTenantBulkCollectionService } from './tenantBulkService.js';
import { createGenericRelationalService } from './genericRelationalService.js';
import { getRequestTenant } from '../lib/tenantContext.js';
import { broadcastCollection } from './websocketService.js';

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

function scopeDeleted<T extends { deletedAt?: string | null }>(
  rows: T[],
  includeDeleted?: boolean,
): T[] {
  if (includeDeleted) return rows.filter((row) => Boolean(row.deletedAt));
  return rows.filter((row) => !row.deletedAt);
}

export async function loadDistributions(options?: {
  includeDeleted?: boolean;
}): Promise<Distribution[]> {
  const rows = await distributionCrud.loadAll({ includeDeleted: true });
  return scopeDeleted(rows, options?.includeDeleted);
}

async function upsertWithBroadcast<T>(
  schema: { parse: (data: unknown) => T[] },
  records: T[],
  bulkSave: (tenant: string, list: T[]) => Promise<void>,
  collection: string,
): Promise<T[]> {
  const tenant = getRequestTenant();
  if (!tenant) throw new Error('Tenant context required');
  const parsed = schema.parse(records);
  await bulkSave(tenant, parsed);
  await broadcastCollection(collection);
  return parsed;
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
