import {
  type Denomination,
  type StockBatch,
  type Distribution,
  type Redemption,
} from '@mms/shared';
import {
  hasanatDenoms,
  hasanatBatches,
  hasanatDistributions,
  hasanatRedemptions,
} from '../schema.js';
import { createGenericRepository } from './genericRepository.js';

const denomsRepo = createGenericRepository<Denomination, typeof hasanatDenoms>(hasanatDenoms, {
  conflictTarget: [hasanatDenoms.workspaceSubdomain, hasanatDenoms.id],
});
const batchesRepo = createGenericRepository<StockBatch, typeof hasanatBatches>(hasanatBatches, {
  conflictTarget: [hasanatBatches.workspaceSubdomain, hasanatBatches.id],
});
const distRepo = createGenericRepository<Distribution, typeof hasanatDistributions>(hasanatDistributions, {
  conflictTarget: [hasanatDistributions.workspaceSubdomain, hasanatDistributions.id],
});
const redempRepo = createGenericRepository<Redemption, typeof hasanatRedemptions>(hasanatRedemptions, {
  conflictTarget: [hasanatRedemptions.workspaceSubdomain, hasanatRedemptions.id],
});

export const listDenomsByWorkspace = denomsRepo.listByWorkspace;
export const bulkSaveDenoms = denomsRepo.bulkSave;
export const replaceDenomsForWorkspace = denomsRepo.replaceForWorkspace;

export const listBatchesByWorkspace = batchesRepo.listByWorkspace;
export const bulkSaveBatches = batchesRepo.bulkSave;
export const replaceBatchesForWorkspace = batchesRepo.replaceForWorkspace;

export const listDistributionsByWorkspace = distRepo.listByWorkspace;
export const findDistributionById = distRepo.findById;
export const saveDistribution = distRepo.save;
export const bulkSaveDistributions = distRepo.bulkSave;
export const replaceDistributionsForWorkspace = distRepo.replaceForWorkspace;

export const listRedemptionsByWorkspace = redempRepo.listByWorkspace;
export const bulkSaveRedemptions = redempRepo.bulkSave;
export const replaceRedemptionsForWorkspace = redempRepo.replaceForWorkspace;

export async function deleteHasanatByWorkspace(workspaceSubdomain: string): Promise<void> {
  await denomsRepo.deleteByWorkspace(workspaceSubdomain);
  await batchesRepo.deleteByWorkspace(workspaceSubdomain);
  await distRepo.deleteByWorkspace(workspaceSubdomain);
  await redempRepo.deleteByWorkspace(workspaceSubdomain);
}
