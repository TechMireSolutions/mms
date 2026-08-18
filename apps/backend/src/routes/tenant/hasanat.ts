import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { authenticateTenant } from '../../middleware/authenticate.js';
import { requireTenantModule } from '../../middleware/requireTenantModule.js';
import {
  HASANAT_MODULE_MANIFEST,
  denomListSchema,
  batchListSchema,
  distributionListSchema,
  redemptionListSchema,
} from '@mms/shared';
import {
  registerBulkRoutes,
  registerMetricsRoute,
  registerSoftDeletableBulkRoutes,
} from '../../lib/crudRouter.js';
import {
  loadDenoms,
  upsertDenoms,
  loadBatches,
  upsertBatches,
  loadDistributions,
  loadDistributionsPage,
  upsertDistributions,
  loadRedemptions,
  upsertRedemptions,
  deleteDistributionById,
  restoreDistributionById,
  bulkSoftDeleteDistributions,
  bulkRestoreDistributions,
  loadHasanatCommandMetrics,
} from '../../services/hasanatService.js';
import { hasanatReportRoutes } from './hasanat/hasanatReportRoutes.js';
import { hasanatSetupConfigRoutes } from './hasanatSetupConfigRoutes.js';
import { hasanatListQuerySchema } from '../../validation/hasanatSchemas.js';

const HASANAT_DISTRIBUTIONS_COLLECTION = HASANAT_MODULE_MANIFEST.collectionKey;
const HASANAT_DENOMS_COLLECTION = HASANAT_MODULE_MANIFEST.denomCollectionKey;
const HASANAT_BATCHES_COLLECTION = HASANAT_MODULE_MANIFEST.batchCollectionKey;
const HASANAT_REDEMPTIONS_COLLECTION = HASANAT_MODULE_MANIFEST.redemptionCollectionKey;

/**
 * Hasanat module routes — bulk upsert + soft-delete distributions.
 */
export default async function hasanatRoutes(
  fastify: FastifyInstance,
  _options: FastifyPluginOptions,
): Promise<void> {
  fastify.addHook('preHandler', authenticateTenant);
  fastify.addHook('preHandler', requireTenantModule('hasanat'));

  await fastify.register(hasanatReportRoutes);
  await fastify.register(hasanatSetupConfigRoutes);

  registerMetricsRoute(fastify, {
    collection: HASANAT_DISTRIBUTIONS_COLLECTION,
    loadMetricsFn: loadHasanatCommandMetrics,
    errorMessagePrefix: 'hasanat',
  });

  registerBulkRoutes(fastify, {
    path: '/denoms',
    collection: HASANAT_DENOMS_COLLECTION,
    schema: denomListSchema,
    loadFn: loadDenoms,
    saveFn: upsertDenoms,
    responseKey: 'denoms',
    errorMessagePrefix: 'denominations',
  });

  registerBulkRoutes(fastify, {
    path: '/batches',
    collection: HASANAT_BATCHES_COLLECTION,
    schema: batchListSchema,
    loadFn: loadBatches,
    saveFn: upsertBatches,
    responseKey: 'batches',
    errorMessagePrefix: 'batches',
  });

  registerSoftDeletableBulkRoutes(fastify, {
    path: '/distributions',
    collection: HASANAT_DISTRIBUTIONS_COLLECTION,
    schema: distributionListSchema,
    loadFn: loadDistributions,
    loadPageFn: loadDistributionsPage,
    listQuerySchema: hasanatListQuerySchema,
    defaultPageSize: HASANAT_MODULE_MANIFEST.defaultPageSize,
    saveFn: upsertDistributions,
    deleteFn: deleteDistributionById,
    restoreFn: restoreDistributionById,
    bulkDeleteFn: bulkSoftDeleteDistributions,
    bulkRestoreFn: bulkRestoreDistributions,
    responseKey: 'distributions',
    errorMessagePrefix: 'distributions',
    nameSingular: 'Distribution',
    columnPreferencesObjectKey: HASANAT_MODULE_MANIFEST.distributionColumnPreferencesObjectKey,
  });

  registerBulkRoutes(fastify, {
    path: '/redemptions',
    collection: HASANAT_REDEMPTIONS_COLLECTION,
    schema: redemptionListSchema,
    loadFn: loadRedemptions,
    saveFn: upsertRedemptions,
    responseKey: 'redemptions',
    errorMessagePrefix: 'redemptions',
    columnPreferencesObjectKey: HASANAT_MODULE_MANIFEST.redemptionColumnPreferencesObjectKey,
  });

}
