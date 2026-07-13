import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { authenticateTenant } from '../../middleware/authenticate.js';
import {
  OBLIGATIONS_MODULE_CONTRACT,
  obligationTypeListSchema,
  mujtahidListSchema,
  mujtahidRepListSchema,
  wakalaTypeListSchema,
  obligationDistributionListSchema,
  obligationCollectionListSchema,
  computeObligationsCommandMetrics,
} from '@mms/shared';
import { registerColumnPreferencesRoutes } from '../../lib/columnPreferencesRouter.js';
import { registerBulkRoutes, registerMetricsRoute } from '../../lib/crudRouter.js';

import {
  loadObligationTypes,
  replaceObligationTypes,
  loadMujtahids,
  replaceMujtahids,
  loadMujtahidReps,
  replaceMujtahidReps,
  loadWakalaTypes,
  replaceWakalaTypes,
  loadObligationDistributions,
  replaceObligationDistributions,
  loadObligationCollections,
  replaceObligationCollections,
} from '../../services/obligationService.js';

const OBLIGATIONS_COLLECTION = OBLIGATIONS_MODULE_CONTRACT.collectionKey;

/**
 * Obligations module routes — metrics + column preferences until REST CRUD ships.
 */
export default async function obligationsRoutes(
  fastify: FastifyInstance,
  _options: FastifyPluginOptions,
): Promise<void> {
  fastify.addHook('preHandler', authenticateTenant);

  // --- Obligation Types ---
  registerBulkRoutes(fastify, {
    path: '/types',
    collection: OBLIGATIONS_COLLECTION,
    schema: obligationTypeListSchema,
    loadFn: loadObligationTypes,
    saveFn: replaceObligationTypes,
    responseKey: 'types',
    errorMessagePrefix: 'obligation types',
  });

  // --- Mujtahids ---
  registerBulkRoutes(fastify, {
    path: '/mujtahids',
    collection: OBLIGATIONS_COLLECTION,
    schema: mujtahidListSchema,
    loadFn: loadMujtahids,
    saveFn: replaceMujtahids,
    responseKey: 'mujtahids',
    errorMessagePrefix: 'mujtahids',
  });

  // --- Mujtahid Reps ---
  registerBulkRoutes(fastify, {
    path: '/reps',
    collection: OBLIGATIONS_COLLECTION,
    schema: mujtahidRepListSchema,
    loadFn: loadMujtahidReps,
    saveFn: replaceMujtahidReps,
    responseKey: 'reps',
    errorMessagePrefix: 'mujtahid reps',
  });

  // --- Wakala Types ---
  registerBulkRoutes(fastify, {
    path: '/wakala',
    collection: OBLIGATIONS_COLLECTION,
    schema: wakalaTypeListSchema,
    loadFn: loadWakalaTypes,
    saveFn: replaceWakalaTypes,
    responseKey: 'wakalaTypes',
    errorMessagePrefix: 'wakala types',
  });

  // --- Obligation Distributions ---
  registerBulkRoutes(fastify, {
    path: '/distributions',
    collection: OBLIGATIONS_COLLECTION,
    schema: obligationDistributionListSchema,
    loadFn: loadObligationDistributions,
    saveFn: replaceObligationDistributions,
    responseKey: 'distributions',
    errorMessagePrefix: 'obligation distributions',
  });

  // --- Obligation Collections ---
  registerBulkRoutes(fastify, {
    path: '/collections',
    collection: OBLIGATIONS_COLLECTION,
    schema: obligationCollectionListSchema,
    loadFn: loadObligationCollections,
    saveFn: replaceObligationCollections,
    responseKey: 'collections',
    errorMessagePrefix: 'obligation collections',
  });

  // --- Metrics ---
  registerMetricsRoute(fastify, {
    collection: OBLIGATIONS_COLLECTION,
    loadMetricsFn: async () => {
      const collections = await loadObligationCollections();
      const types = await loadObligationTypes();
      return computeObligationsCommandMetrics(
        collections as Array<{ amount?: number; payment_mode?: string; received_date?: string }>,
        types.length,
      );
    },
    errorMessagePrefix: 'obligation',
  });

  registerColumnPreferencesRoutes(fastify, {
    collection: OBLIGATIONS_COLLECTION,
    objectKey: OBLIGATIONS_MODULE_CONTRACT.columnPreferencesObjectKey,
  });
}
