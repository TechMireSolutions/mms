import {
  type ObligationType,
  type Mujtahid,
  type MujtahidRep,
  type WakalaType,
  type ObligationDistribution,
  type ObligationCollection,
} from '@mms/shared';
import {
  obligationTypes,
  mujtahids,
  mujtahidReps,
  wakalaTypes,
  obligationDistributions,
  obligationCollections,
} from '../schema.js';
import { createGenericRepository } from './genericRepository.js';

const typesRepo = createGenericRepository<ObligationType, typeof obligationTypes>(obligationTypes);
const mujtahidsRepo = createGenericRepository<Mujtahid, typeof mujtahids>(mujtahids);
const repsRepo = createGenericRepository<MujtahidRep, typeof mujtahidReps>(mujtahidReps);
const wakalasRepo = createGenericRepository<WakalaType, typeof wakalaTypes>(wakalaTypes);
const distRepo = createGenericRepository<ObligationDistribution, typeof obligationDistributions>(obligationDistributions);
const collRepo = createGenericRepository<ObligationCollection, typeof obligationCollections>(obligationCollections);

export const listObligationTypesByWorkspace = typesRepo.listByWorkspace;
export const replaceObligationTypesForWorkspace = typesRepo.replaceForWorkspace;

export const listMujtahidsByWorkspace = mujtahidsRepo.listByWorkspace;
export const replaceMujtahidsForWorkspace = mujtahidsRepo.replaceForWorkspace;

export const listMujtahidRepsByWorkspace = repsRepo.listByWorkspace;
export const replaceMujtahidRepsForWorkspace = repsRepo.replaceForWorkspace;

export const listWakalaTypesByWorkspace = wakalasRepo.listByWorkspace;
export const replaceWakalaTypesForWorkspace = wakalasRepo.replaceForWorkspace;

export const listObligationDistributionsByWorkspace = distRepo.listByWorkspace;
export const replaceObligationDistributionsForWorkspace = distRepo.replaceForWorkspace;

export const listObligationCollectionsByWorkspace = collRepo.listByWorkspace;
export const replaceObligationCollectionsForWorkspace = collRepo.replaceForWorkspace;

export async function deleteObligationsByWorkspace(workspaceSubdomain: string): Promise<void> {
  await typesRepo.deleteByWorkspace(workspaceSubdomain);
  await mujtahidsRepo.deleteByWorkspace(workspaceSubdomain);
  await repsRepo.deleteByWorkspace(workspaceSubdomain);
  await wakalasRepo.deleteByWorkspace(workspaceSubdomain);
  await distRepo.deleteByWorkspace(workspaceSubdomain);
  await collRepo.deleteByWorkspace(workspaceSubdomain);
}
