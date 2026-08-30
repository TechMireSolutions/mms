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


import { obligationContractRouter } from './obligations/obligationContractRouter.js';
import { obligationReportRoutes } from './obligations/obligationReportRoutes.js';
import {
  upsertObligationTypes,
  upsertMujtahids,
  loadMujtahidReps,
  upsertMujtahidReps,
  loadWakalaTypes,
  upsertWakalaTypes,
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

  await fastify.register(
    async (sub) => {
      registerBulkRoutes(sub, {
        path: '/types',
        collection: OBLIGATIONS_COLLECTION,
        schema: obligationTypeListSchema,
        saveFn: upsertObligationTypes,
        responseKey: 'types',
        errorMessagePrefix: 'obligation types',
        customGetRoute: true,
      });

      registerBulkRoutes(sub, {
        path: '/mujtahids',
        collection: OBLIGATIONS_COLLECTION,
        schema: mujtahidListSchema,
        saveFn: upsertMujtahids,
        responseKey: 'mujtahids',
        errorMessagePrefix: 'mujtahids',
        customGetRoute: true,
      });

      registerBulkRoutes(sub, {
        path: '/reps',
        collection: OBLIGATIONS_COLLECTION,
        schema: mujtahidRepListSchema,
        loadFn: loadMujtahidReps,
        saveFn: upsertMujtahidReps,
        responseKey: 'reps',
        errorMessagePrefix: 'mujtahid reps',
      });

      registerBulkRoutes(sub, {
        path: '/wakala',
        collection: OBLIGATIONS_COLLECTION,
        schema: wakalaTypeListSchema,
        loadFn: loadWakalaTypes,
        saveFn: upsertWakalaTypes,
        responseKey: 'wakalaTypes',
        errorMessagePrefix: 'wakala types',
      });

      registerBulkRoutes(sub, {
        path: '/distributions',
        collection: OBLIGATIONS_COLLECTION,
        schema: obligationDistributionListSchema,
        saveFn: upsertObligationDistributions,
        responseKey: 'distributions',
        errorMessagePrefix: 'obligation distributions',
        customGetRoute: true,
      });

      registerSoftDeletableBulkRoutes(sub, {
        path: '/collections',
        collection: OBLIGATIONS_COLLECTION,
        schema: obligationCollectionListSchema,
        loadFn: loadObligationCollections,
        saveFn: upsertObligationCollections as any,
        deleteFn: deleteObligationCollectionById,
        restoreFn: restoreObligationCollectionById,
        bulkDeleteFn: bulkSoftDeleteObligationCollections,
        bulkRestoreFn: bulkRestoreObligationCollections,
        responseKey: 'collections',
        errorMessagePrefix: 'obligation collections',
        nameSingular: 'Obligation collection',
        customGetRoute: true,
      });

      registerMetricsRoute(sub, {
        collection: OBLIGATIONS_COLLECTION,
        loadMetricsFn: loadObligationsCommandMetrics,
        errorMessagePrefix: 'obligation',
      });

      await sub.register(obligationReportRoutes);
    },
    { prefix: '/api/obligations' },
  );

  await fastify.register(obligationContractRouter);
}
