import type { ObligationsRepository } from './obligationsRepository.js';
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
} from '../../db/repositories/obligationRepository.js';
import { aggregateObligationsCommandMetrics } from '../../db/repositories/obligationRepositoryMetrics.js';
import { aggregateObligationsReport } from '../../db/repositories/obligationRepositoryReport.js';

/**
 * Drizzle-backed adapter for {@link ObligationsRepository}. Delegates to the
 * existing concrete repository functions (no SQL rewrite in this pass).
 */
export const obligationsRepository: ObligationsRepository = {
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
  aggregateObligationsCommandMetrics,
  aggregateObligationsReport,
};
