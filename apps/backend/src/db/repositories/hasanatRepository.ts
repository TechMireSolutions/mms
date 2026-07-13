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

const denomsRepo = createGenericRepository<Denomination, typeof hasanatDenoms>(hasanatDenoms);
const batchesRepo = createGenericRepository<StockBatch, typeof hasanatBatches>(hasanatBatches);
const distRepo = createGenericRepository<Distribution, typeof hasanatDistributions>(hasanatDistributions);
const redempRepo = createGenericRepository<Redemption, typeof hasanatRedemptions>(hasanatRedemptions);

export const listDenomsByWorkspace = denomsRepo.listByWorkspace;
export const replaceDenomsForWorkspace = denomsRepo.replaceForWorkspace;

export const listBatchesByWorkspace = batchesRepo.listByWorkspace;
export const replaceBatchesForWorkspace = batchesRepo.replaceForWorkspace;

export const listDistributionsByWorkspace = distRepo.listByWorkspace;
export const replaceDistributionsForWorkspace = distRepo.replaceForWorkspace;

export const listRedemptionsByWorkspace = redempRepo.listByWorkspace;
export const replaceRedemptionsForWorkspace = redempRepo.replaceForWorkspace;

export async function deleteHasanatByWorkspace(workspaceSubdomain: string): Promise<void> {
  await denomsRepo.deleteByWorkspace(workspaceSubdomain);
  await batchesRepo.deleteByWorkspace(workspaceSubdomain);
  await distRepo.deleteByWorkspace(workspaceSubdomain);
  await redempRepo.deleteByWorkspace(workspaceSubdomain);
}
