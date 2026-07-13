import {
  type ObligationType,
  type Mujtahid,
  type MujtahidRep,
  type WakalaType,
  type ObligationDistribution,
  type ObligationCollection,
  obligationTypeListSchema,
  mujtahidListSchema,
  mujtahidRepListSchema,
  wakalaTypeListSchema,
  obligationDistributionListSchema,
  obligationCollectionListSchema,
} from '@mms/shared';
import {
  listObligationTypesByWorkspace,
  replaceObligationTypesForWorkspace,
  listMujtahidsByWorkspace,
  replaceMujtahidsForWorkspace,
  listMujtahidRepsByWorkspace,
  replaceMujtahidRepsForWorkspace,
  listWakalaTypesByWorkspace,
  replaceWakalaTypesForWorkspace,
  listObligationDistributionsByWorkspace,
  replaceObligationDistributionsForWorkspace,
  listObligationCollectionsByWorkspace,
  replaceObligationCollectionsForWorkspace,
} from '../db/repositories/obligationRepository.js';
import { defineTenantBulkCollectionService } from './tenantBulkService.js';

const obligationTypeService = defineTenantBulkCollectionService<ObligationType>(
  { listByWorkspace: listObligationTypesByWorkspace, replaceForWorkspace: replaceObligationTypesForWorkspace },
  obligationTypeListSchema,
  'obligation_types',
);
export const loadObligationTypes = obligationTypeService.load;
export const replaceObligationTypes = obligationTypeService.replace;

const mujtahidService = defineTenantBulkCollectionService<Mujtahid>(
  { listByWorkspace: listMujtahidsByWorkspace, replaceForWorkspace: replaceMujtahidsForWorkspace },
  mujtahidListSchema,
  'mujtahids',
);
export const loadMujtahids = mujtahidService.load;
export const replaceMujtahids = mujtahidService.replace;

const mujtahidRepService = defineTenantBulkCollectionService<MujtahidRep>(
  { listByWorkspace: listMujtahidRepsByWorkspace, replaceForWorkspace: replaceMujtahidRepsForWorkspace },
  mujtahidRepListSchema,
  'mujtahid_reps',
);
export const loadMujtahidReps = mujtahidRepService.load;
export const replaceMujtahidReps = mujtahidRepService.replace;

const wakalaTypeService = defineTenantBulkCollectionService<WakalaType>(
  { listByWorkspace: listWakalaTypesByWorkspace, replaceForWorkspace: replaceWakalaTypesForWorkspace },
  wakalaTypeListSchema,
  'wakala_types',
);
export const loadWakalaTypes = wakalaTypeService.load;
export const replaceWakalaTypes = wakalaTypeService.replace;

const distributionService = defineTenantBulkCollectionService<ObligationDistribution>(
  { listByWorkspace: listObligationDistributionsByWorkspace, replaceForWorkspace: replaceObligationDistributionsForWorkspace },
  obligationDistributionListSchema,
  'obligation_distributions',
);
export const loadObligationDistributions = distributionService.load;
export const replaceObligationDistributions = distributionService.replace;

const collectionService = defineTenantBulkCollectionService<ObligationCollection>(
  { listByWorkspace: listObligationCollectionsByWorkspace, replaceForWorkspace: replaceObligationCollectionsForWorkspace },
  obligationCollectionListSchema,
  'obligation_collections',
);
export const loadObligationCollections = collectionService.load;
export const replaceObligationCollections = collectionService.replace;
