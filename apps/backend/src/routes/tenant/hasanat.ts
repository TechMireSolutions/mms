import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { authenticateTenant } from '../../middleware/authenticate.js';
import {
  HASANAT_MODULE_CONTRACT,
  denomListSchema,
  batchListSchema,
  distributionListSchema,
  redemptionListSchema,
  computeHasanatCommandMetrics,
} from '@mms/shared';
import { registerBulkRoutes, registerMetricsRoute } from '../../lib/crudRouter.js';
import {
  loadDenoms,
  replaceDenoms,
  loadBatches,
  replaceBatches,
  loadDistributions,
  replaceDistributions,
  loadRedemptions,
  replaceRedemptions,
} from '../../services/hasanatService.js';

const HASANAT_DISTRIBUTIONS_COLLECTION = HASANAT_MODULE_CONTRACT.collectionKey;
const HASANAT_DENOMS_COLLECTION = HASANAT_MODULE_CONTRACT.denomCollectionKey;
const HASANAT_BATCHES_COLLECTION = HASANAT_MODULE_CONTRACT.batchCollectionKey;
const HASANAT_REDEMPTIONS_COLLECTION = HASANAT_MODULE_CONTRACT.redemptionCollectionKey;

/**
 * Hasanat module routes — denoms, batches, distributions, redemptions, metrics, and column preferences.
 */
export default async function hasanatRoutes(
  fastify: FastifyInstance,
  _options: FastifyPluginOptions,
): Promise<void> {
  fastify.addHook('preHandler', authenticateTenant);

  // --- Metrics ---
  registerMetricsRoute(fastify, {
    collection: HASANAT_DISTRIBUTIONS_COLLECTION,
    loadMetricsFn: async () => {
      const batches = await loadBatches();
      const distributions = await loadDistributions();
      const denoms = await loadDenoms();
      return computeHasanatCommandMetrics(
        batches as Array<{ quantity?: number; remaining?: number }>,
        distributions as Array<{ status?: string; quantity?: number }>,
        denoms as Array<{ active?: boolean }>,
      );
    },
    errorMessagePrefix: 'hasanat',
  });

  // --- Denominations ---
  registerBulkRoutes(fastify, {
    path: '/denoms',
    collection: HASANAT_DENOMS_COLLECTION,
    schema: denomListSchema,
    loadFn: loadDenoms,
    saveFn: replaceDenoms,
    responseKey: 'denoms',
    errorMessagePrefix: 'denominations',
  });

  // --- Batches ---
  registerBulkRoutes(fastify, {
    path: '/batches',
    collection: HASANAT_BATCHES_COLLECTION,
    schema: batchListSchema,
    loadFn: loadBatches,
    saveFn: replaceBatches,
    responseKey: 'batches',
    errorMessagePrefix: 'batches',
  });

  // --- Distributions ---
  registerBulkRoutes(fastify, {
    path: '/distributions',
    collection: HASANAT_DISTRIBUTIONS_COLLECTION,
    schema: distributionListSchema,
    loadFn: loadDistributions,
    saveFn: replaceDistributions,
    responseKey: 'distributions',
    errorMessagePrefix: 'distributions',
    columnPreferencesObjectKey: HASANAT_MODULE_CONTRACT.distributionColumnPreferencesObjectKey,
  });

  // --- Redemptions ---
  registerBulkRoutes(fastify, {
    path: '/redemptions',
    collection: HASANAT_REDEMPTIONS_COLLECTION,
    schema: redemptionListSchema,
    loadFn: loadRedemptions,
    saveFn: replaceRedemptions,
    responseKey: 'redemptions',
    errorMessagePrefix: 'redemptions',
    columnPreferencesObjectKey: HASANAT_MODULE_CONTRACT.redemptionColumnPreferencesObjectKey,
  });
}
