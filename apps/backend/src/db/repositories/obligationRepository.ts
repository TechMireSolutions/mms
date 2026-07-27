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

const typesRepo = createGenericRepository<ObligationType, typeof obligationTypes>(obligationTypes, {
  conflictTarget: [obligationTypes.workspaceSubdomain, obligationTypes.id],
});
const mujtahidsRepo = createGenericRepository<Mujtahid, typeof mujtahids>(mujtahids, {
  conflictTarget: [mujtahids.workspaceSubdomain, mujtahids.id],
});
const repsRepo = createGenericRepository<MujtahidRep, typeof mujtahidReps>(mujtahidReps, {
  conflictTarget: [mujtahidReps.workspaceSubdomain, mujtahidReps.id],
});
const wakalasRepo = createGenericRepository<WakalaType, typeof wakalaTypes>(wakalaTypes, {
  conflictTarget: [wakalaTypes.workspaceSubdomain, wakalaTypes.id],
});
const distRepo = createGenericRepository<ObligationDistribution, typeof obligationDistributions>(
  obligationDistributions,
  {
    conflictTarget: [obligationDistributions.workspaceSubdomain, obligationDistributions.id],
  },
);
const collRepo = createGenericRepository<ObligationCollection, typeof obligationCollections>(
  obligationCollections,
  {
    conflictTarget: [obligationCollections.workspaceSubdomain, obligationCollections.id],
  },
);

export const listObligationTypesByWorkspace = typesRepo.listByWorkspace;
export const bulkSaveObligationTypes = typesRepo.bulkSave;
export const replaceObligationTypesForWorkspace = typesRepo.replaceForWorkspace;

export const listMujtahidsByWorkspace = mujtahidsRepo.listByWorkspace;
export const bulkSaveMujtahids = mujtahidsRepo.bulkSave;
export const replaceMujtahidsForWorkspace = mujtahidsRepo.replaceForWorkspace;

export const listMujtahidRepsByWorkspace = repsRepo.listByWorkspace;
export const bulkSaveMujtahidReps = repsRepo.bulkSave;
export const replaceMujtahidRepsForWorkspace = repsRepo.replaceForWorkspace;

export const listWakalaTypesByWorkspace = wakalasRepo.listByWorkspace;
export const bulkSaveWakalaTypes = wakalasRepo.bulkSave;
export const replaceWakalaTypesForWorkspace = wakalasRepo.replaceForWorkspace;

export const listObligationDistributionsByWorkspace = distRepo.listByWorkspace;
export const bulkSaveObligationDistributions = distRepo.bulkSave;
export const replaceObligationDistributionsForWorkspace = distRepo.replaceForWorkspace;

export const listObligationCollectionsByWorkspace = collRepo.listByWorkspace;
export const findObligationCollectionById = collRepo.findById;
export const saveObligationCollection = collRepo.save;
export const bulkSaveObligationCollections = collRepo.bulkSave;
export const replaceObligationCollectionsForWorkspace = collRepo.replaceForWorkspace;

export async function deleteObligationsByWorkspace(workspaceSubdomain: string): Promise<void> {
  await typesRepo.deleteByWorkspace(workspaceSubdomain);
  await mujtahidsRepo.deleteByWorkspace(workspaceSubdomain);
  await repsRepo.deleteByWorkspace(workspaceSubdomain);
  await wakalasRepo.deleteByWorkspace(workspaceSubdomain);
  await distRepo.deleteByWorkspace(workspaceSubdomain);
  await collRepo.deleteByWorkspace(workspaceSubdomain);
}
