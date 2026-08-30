import {
  type ObligationType,
  type Mujtahid,
  type MujtahidRep,
  type WakalaType,
  type ObligationDistribution,
  type ObligationCollection,
  type ObligationsCommandMetricsSnapshot,
  type ObligationsReportAggregates,
  type ObligationsReportQuery,
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
import { aggregateObligationsCommandMetrics } from '../db/repositories/obligationRepositoryMetrics.js';
import { aggregateObligationsReport } from '../db/repositories/obligationRepositoryReport.js';
import {
  defineTenantBulkCollectionService,
  scopeDeleted,
  upsertWithBroadcast,
} from './tenantBulkService.js';
import { createGenericRelationalService } from './genericRelationalService.js';
import { getRequestTenant } from '../lib/tenantContext.js';

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

export async function loadObligationCollections(options?: {
  includeDeleted?: boolean;
}): Promise<ObligationCollection[]> {
  const rows = await collectionCrud.loadAll({ includeDeleted: true });
  return scopeDeleted(rows, options?.includeDeleted);
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

const EMPTY_OBLIGATIONS_METRICS: ObligationsCommandMetricsSnapshot = {
  total: 0,
  totalAmount: 0,
  cash: 0,
  online: 0,
  newThisPeriod: 0,
  obligationTypes: 0,
};

export async function loadObligationsCommandMetrics(): Promise<ObligationsCommandMetricsSnapshot> {
  const tenant = getRequestTenant();
  if (!tenant) return EMPTY_OBLIGATIONS_METRICS;
  return aggregateObligationsCommandMetrics(tenant);
}

export async function loadObligationsReportAggregates(
  query: ObligationsReportQuery = {},
): Promise<ObligationsReportAggregates> {
  const tenant = getRequestTenant();
  if (!tenant) {
    return {
      totalCollections: 0,
      totalAmount: 0,
      uniqueReps: 0,
      typeBreakdown: [],
      monthlyTrend: [],
      wakalaSummary: [],
      repSummary: [],
    };
  }
  return aggregateObligationsReport(tenant, query);
}

