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
  obligationCollectionRecordSchema,
} from '@mms/shared';
import {
  listObligationTypesByWorkspace,
  bulkSaveObligationTypes,
  replaceObligationTypesForWorkspace,
  listMujtahidsByWorkspace,
  bulkSaveMujtahids,
  replaceMujtahidsForWorkspace,
  listMujtahidRepsByWorkspace,
  bulkSaveMujtahidReps,
  replaceMujtahidRepsForWorkspace,
  listWakalaTypesByWorkspace,
  bulkSaveWakalaTypes,
  replaceWakalaTypesForWorkspace,
  listObligationDistributionsByWorkspace,
  bulkSaveObligationDistributions,
  replaceObligationDistributionsForWorkspace,
  listObligationCollectionsByWorkspace,
  findObligationCollectionById,
  saveObligationCollection,
  bulkSaveObligationCollections,
  replaceObligationCollectionsForWorkspace,
} from '../db/repositories/obligationRepository.js';
import { defineTenantBulkCollectionService } from './tenantBulkService.js';
import { createGenericRelationalService } from './genericRelationalService.js';
import { getRequestTenant } from '../lib/tenantContext.js';
import { broadcastCollection } from './websocketService.js';

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
  {
    listByWorkspace: listObligationDistributionsByWorkspace,
    replaceForWorkspace: replaceObligationDistributionsForWorkspace,
  },
  obligationDistributionListSchema,
  'obligation_distributions',
);
export const loadObligationDistributions = distributionService.load;
export const replaceObligationDistributions = distributionService.replace;

const collectionBulkService = defineTenantBulkCollectionService<ObligationCollection>(
  {
    listByWorkspace: listObligationCollectionsByWorkspace,
    replaceForWorkspace: replaceObligationCollectionsForWorkspace,
  },
  obligationCollectionListSchema,
  'obligation_collections',
);
export const replaceObligationCollections = collectionBulkService.replace;

const collectionCrud = createGenericRelationalService<ObligationCollection>({
  repo: {
    listByWorkspace: listObligationCollectionsByWorkspace,
    findById: findObligationCollectionById,
    save: saveObligationCollection,
  },
  schema: obligationCollectionRecordSchema,
  websocketCollection: 'obligation_collections',
  idPrefix: 'oc',
});

function scopeDeleted<T extends { deletedAt?: string | null }>(
  rows: T[],
  includeDeleted?: boolean,
): T[] {
  if (includeDeleted) return rows.filter((row) => Boolean(row.deletedAt));
  return rows.filter((row) => !row.deletedAt);
}

export async function loadObligationCollections(options?: {
  includeDeleted?: boolean;
}): Promise<ObligationCollection[]> {
  const rows = await collectionCrud.loadAll({ includeDeleted: true });
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

export const upsertObligationTypes = (types: ObligationType[]) =>
  upsertWithBroadcast(obligationTypeListSchema, types, bulkSaveObligationTypes, 'obligation_types');

export const upsertMujtahids = (records: Mujtahid[]) =>
  upsertWithBroadcast(mujtahidListSchema, records, bulkSaveMujtahids, 'mujtahids');

export const upsertMujtahidReps = (records: MujtahidRep[]) =>
  upsertWithBroadcast(mujtahidRepListSchema, records, bulkSaveMujtahidReps, 'mujtahid_reps');

export const upsertWakalaTypes = (records: WakalaType[]) =>
  upsertWithBroadcast(wakalaTypeListSchema, records, bulkSaveWakalaTypes, 'wakala_types');

export const upsertObligationDistributions = (records: ObligationDistribution[]) =>
  upsertWithBroadcast(
    obligationDistributionListSchema,
    records,
    bulkSaveObligationDistributions,
    'obligation_distributions',
  );

export const upsertObligationCollections = (records: ObligationCollection[]) =>
  upsertWithBroadcast(
    obligationCollectionListSchema,
    records,
    bulkSaveObligationCollections,
    'obligation_collections',
  );

export const deleteObligationCollectionById = collectionCrud.deleteById;
export const restoreObligationCollectionById = collectionCrud.restoreById;
export const bulkSoftDeleteObligationCollections = collectionCrud.bulkDeleteByIds;
export const bulkRestoreObligationCollections = collectionCrud.bulkRestoreByIds;
