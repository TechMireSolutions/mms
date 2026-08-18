import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { authenticateTenant } from '../../middleware/authenticate.js';
import {
  OBLIGATIONS_MODULE_MANIFEST,
  obligationTypeListSchema,
  mujtahidListSchema,
  mujtahidRepListSchema,
  wakalaTypeListSchema,
  obligationDistributionListSchema,
  obligationCollectionListSchema,
} from '@mms/shared';
import {
  registerBulkRoutes,
  registerMetricsRoute,
  registerSoftDeletableBulkRoutes,
} from '../../lib/crudRouter.js';
import { registerColumnPreferencesRoutes } from '../../lib/columnPreferencesRouter.js';

import {
  loadObligationTypes,
  upsertObligationTypes,
  loadMujtahids,
  upsertMujtahids,
  loadMujtahidReps,
  upsertMujtahidReps,
  loadWakalaTypes,
  upsertWakalaTypes,
  loadObligationDistributions,
  upsertObligationDistributions,
  loadObligationCollections,
  upsertObligationCollections,
  deleteObligationCollectionById,
  restoreObligationCollectionById,
  bulkSoftDeleteObligationCollections,
  bulkRestoreObligationCollections,
  loadObligationsCommandMetrics,
} from '../../services/obligationService.js';

const OBLIGATIONS_COLLECTION = OBLIGATIONS_MODULE_MANIFEST.collectionKey;

/**
 * Obligations module routes — bulk upsert lookups + soft-delete collections.
 */
export default async function obligationsRoutes(
  fastify: FastifyInstance,
  _options: FastifyPluginOptions,
): Promise<void> {
  fastify.addHook('preHandler', authenticateTenant);

  registerBulkRoutes(fastify, {
    path: '/types',
    collection: OBLIGATIONS_COLLECTION,
    schema: obligationTypeListSchema,
    loadFn: loadObligationTypes,
    saveFn: upsertObligationTypes,
    responseKey: 'types',
    errorMessagePrefix: 'obligation types',
  });

  registerBulkRoutes(fastify, {
    path: '/mujtahids',
    collection: OBLIGATIONS_COLLECTION,
    schema: mujtahidListSchema,
    loadFn: loadMujtahids,
    saveFn: upsertMujtahids,
    responseKey: 'mujtahids',
    errorMessagePrefix: 'mujtahids',
  });

  registerBulkRoutes(fastify, {
    path: '/reps',
    collection: OBLIGATIONS_COLLECTION,
    schema: mujtahidRepListSchema,
    loadFn: loadMujtahidReps,
    saveFn: upsertMujtahidReps,
    responseKey: 'reps',
    errorMessagePrefix: 'mujtahid reps',
  });

  registerBulkRoutes(fastify, {
    path: '/wakala',
    collection: OBLIGATIONS_COLLECTION,
    schema: wakalaTypeListSchema,
    loadFn: loadWakalaTypes,
    saveFn: upsertWakalaTypes,
    responseKey: 'wakalaTypes',
    errorMessagePrefix: 'wakala types',
  });

  registerBulkRoutes(fastify, {
    path: '/distributions',
    collection: OBLIGATIONS_COLLECTION,
    schema: obligationDistributionListSchema,
    loadFn: loadObligationDistributions,
    saveFn: upsertObligationDistributions,
    responseKey: 'distributions',
    errorMessagePrefix: 'obligation distributions',
  });

  registerSoftDeletableBulkRoutes(fastify, {
    path: '/collections',
    collection: OBLIGATIONS_COLLECTION,
    schema: obligationCollectionListSchema,
    loadFn: loadObligationCollections,
    saveFn: upsertObligationCollections,
    deleteFn: deleteObligationCollectionById,
    restoreFn: restoreObligationCollectionById,
    bulkDeleteFn: bulkSoftDeleteObligationCollections,
    bulkRestoreFn: bulkRestoreObligationCollections,
    responseKey: 'collections',
    errorMessagePrefix: 'obligation collections',
    nameSingular: 'Obligation collection',
  });

  registerColumnPreferencesRoutes(fastify, {
    path: '/column-preferences',
    collection: OBLIGATIONS_COLLECTION,
    objectKey: OBLIGATIONS_MODULE_MANIFEST.columnPreferencesObjectKey,
  });

  registerMetricsRoute(fastify, {
    collection: OBLIGATIONS_COLLECTION,
    loadMetricsFn: loadObligationsCommandMetrics,
    errorMessagePrefix: 'obligation',
  });
}
