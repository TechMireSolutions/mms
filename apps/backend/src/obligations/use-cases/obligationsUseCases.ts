import type { ObligationsRepository } from '../repository/obligationsRepository.js';
import { obligationsRepository } from '../repository/obligationsRepositoryAdapter.js';
import { getRequestTenant } from '../../lib/tenantContext.js';
import { createGenericRelationalService } from '../../services/genericRelationalService.js';
import {
  defineTenantBulkCollectionService,
  scopeDeleted,
  upsertWithBroadcast,
} from '../../services/tenantBulkService.js';
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

const EMPTY_OBLIGATIONS_METRICS: ObligationsCommandMetricsSnapshot = {
  total: 0,
  totalAmount: 0,
  cash: 0,
  online: 0,
  newThisPeriod: 0,
  obligationTypes: 0,
};

/**
 * Obligations use-cases — composition root binding an
 * {@link ObligationsRepository} to every operation. Production uses the default
 * Drizzle-backed `obligationsUseCases`; tests can pass a fake repository to
 * exercise orchestration in isolation.
 */
export function createObligationsUseCases(repo: ObligationsRepository = obligationsRepository) {
  const obligationTypeService = defineTenantBulkCollectionService<ObligationType>(
    { listByWorkspace: repo.listObligationTypesByWorkspace, replaceForWorkspace: repo.replaceObligationTypesForWorkspace },
    obligationTypeListSchema,
    'obligation_types',
  );

  const mujtahidService = defineTenantBulkCollectionService<Mujtahid>(
    { listByWorkspace: repo.listMujtahidsByWorkspace, replaceForWorkspace: repo.replaceMujtahidsForWorkspace },
    mujtahidListSchema,
    'mujtahids',
  );

  const mujtahidRepService = defineTenantBulkCollectionService<MujtahidRep>(
    { listByWorkspace: repo.listMujtahidRepsByWorkspace, replaceForWorkspace: repo.replaceMujtahidRepsForWorkspace },
    mujtahidRepListSchema,
    'mujtahid_reps',
  );

  const wakalaTypeService = defineTenantBulkCollectionService<WakalaType>(
    { listByWorkspace: repo.listWakalaTypesByWorkspace, replaceForWorkspace: repo.replaceWakalaTypesForWorkspace },
    wakalaTypeListSchema,
    'wakala_types',
  );

  const distributionService = defineTenantBulkCollectionService<ObligationDistribution>(
    {
      listByWorkspace: repo.listObligationDistributionsByWorkspace,
      replaceForWorkspace: repo.replaceObligationDistributionsForWorkspace,
    },
    obligationDistributionListSchema,
    'obligation_distributions',
  );

  const collectionBulkService = defineTenantBulkCollectionService<ObligationCollection>(
    {
      listByWorkspace: repo.listObligationCollectionsByWorkspace,
      replaceForWorkspace: repo.replaceObligationCollectionsForWorkspace,
    },
    obligationCollectionListSchema,
    'obligation_collections',
  );

  const collectionCrud = createGenericRelationalService<ObligationCollection>({
    repo: {
      listByWorkspace: repo.listObligationCollectionsByWorkspace,
      findById: repo.findObligationCollectionById,
      save: repo.saveObligationCollection,
    },
    schema: obligationCollectionRecordSchema,
    websocketCollection: 'obligation_collections',
    idPrefix: 'oc',
  });

  return {
    loadObligationTypes: obligationTypeService.load,
    replaceObligationTypes: obligationTypeService.replace,
    loadMujtahids: mujtahidService.load,
    replaceMujtahids: mujtahidService.replace,
    loadMujtahidReps: mujtahidRepService.load,
    replaceMujtahidReps: mujtahidRepService.replace,
    loadWakalaTypes: wakalaTypeService.load,
    replaceWakalaTypes: wakalaTypeService.replace,
    loadObligationDistributions: distributionService.load,
    replaceObligationDistributions: distributionService.replace,
    replaceObligationCollections: collectionBulkService.replace,

    loadObligationCollections: async (options?: { includeDeleted?: boolean }): Promise<ObligationCollection[]> => {
      const rows = await collectionCrud.loadAll({ includeDeleted: true });
      return scopeDeleted(rows, options?.includeDeleted);
    },

    upsertObligationTypes: (types: ObligationType[]) =>
      upsertWithBroadcast(obligationTypeListSchema, types, repo.bulkSaveObligationTypes, 'obligation_types'),
    upsertMujtahids: (records: Mujtahid[]) =>
      upsertWithBroadcast(mujtahidListSchema, records, repo.bulkSaveMujtahids, 'mujtahids'),
    upsertMujtahidReps: (records: MujtahidRep[]) =>
      upsertWithBroadcast(mujtahidRepListSchema, records, repo.bulkSaveMujtahidReps, 'mujtahid_reps'),
    upsertWakalaTypes: (records: WakalaType[]) =>
      upsertWithBroadcast(wakalaTypeListSchema, records, repo.bulkSaveWakalaTypes, 'wakala_types'),
    upsertObligationDistributions: (records: ObligationDistribution[]) =>
      upsertWithBroadcast(
        obligationDistributionListSchema,
        records,
        repo.bulkSaveObligationDistributions,
        'obligation_distributions',
      ),
    upsertObligationCollections: (records: ObligationCollection[]) =>
      upsertWithBroadcast(
        obligationCollectionListSchema,
        records,
        repo.bulkSaveObligationCollections,
        'obligation_collections',
      ),

    deleteObligationCollectionById: collectionCrud.deleteById,
    restoreObligationCollectionById: collectionCrud.restoreById,
    bulkSoftDeleteObligationCollections: collectionCrud.bulkDeleteByIds,
    bulkRestoreObligationCollections: collectionCrud.bulkRestoreByIds,

    loadObligationsCommandMetrics: async (): Promise<ObligationsCommandMetricsSnapshot> => {
      const tenant = getRequestTenant();
      if (!tenant) return EMPTY_OBLIGATIONS_METRICS;
      return repo.aggregateObligationsCommandMetrics(tenant);
    },

    loadObligationsReportAggregates: async (
      query: ObligationsReportQuery = {},
    ): Promise<ObligationsReportAggregates> => {
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
      return repo.aggregateObligationsReport(tenant, query);
    },
  };
}

export const obligationsUseCases = createObligationsUseCases();
