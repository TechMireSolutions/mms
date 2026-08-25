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
  upsertDenoms,
  upsertBatches,
  loadDistributions,
  upsertDistributions,
  upsertRedemptions,
  deleteDistributionById,
  restoreDistributionById,
  bulkSoftDeleteDistributions,
  bulkRestoreDistributions,
  loadHasanatCommandMetrics,
} from '../../services/hasanatService.js';
import { hasanatReportRoutes } from './hasanat/hasanatReportRoutes.js';
import { hasanatSetupConfigRoutes } from './hasanatSetupConfigRoutes.js';
import { hasanatContractRouter } from './hasanat/hasanatContractRouter.js';

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

  await fastify.register(
    async (sub) => {
      await sub.register(hasanatReportRoutes);
      await sub.register(hasanatSetupConfigRoutes);

      registerMetricsRoute(sub, {
        collection: HASANAT_DISTRIBUTIONS_COLLECTION,
        loadMetricsFn: loadHasanatCommandMetrics,
        errorMessagePrefix: 'hasanat',
      });

      registerBulkRoutes(sub, {
        path: '/denoms',
        collection: HASANAT_DENOMS_COLLECTION,
        schema: denomListSchema,
        saveFn: upsertDenoms,
        responseKey: 'denoms',
        errorMessagePrefix: 'denominations',
        customGetRoute: true,
      });

      registerBulkRoutes(sub, {
        path: '/batches',
        collection: HASANAT_BATCHES_COLLECTION,
        schema: batchListSchema,
        saveFn: upsertBatches,
        responseKey: 'batches',
        errorMessagePrefix: 'batches',
        customGetRoute: true,
      });

      registerSoftDeletableBulkRoutes(sub, {
        path: '/distributions',
        collection: HASANAT_DISTRIBUTIONS_COLLECTION,
        schema: distributionListSchema,
        loadFn: loadDistributions,
        saveFn: upsertDistributions as any,
        deleteFn: deleteDistributionById,
        restoreFn: restoreDistributionById,
        bulkDeleteFn: bulkSoftDeleteDistributions,
        bulkRestoreFn: bulkRestoreDistributions,
        responseKey: 'distributions',
        errorMessagePrefix: 'distributions',
        nameSingular: 'Distribution',

        customGetRoute: true,
        customBulkTrashRoutes: true,
      });

      registerBulkRoutes(sub, {
        path: '/redemptions',
        collection: HASANAT_REDEMPTIONS_COLLECTION,
        schema: redemptionListSchema,
        saveFn: upsertRedemptions,
        responseKey: 'redemptions',
        errorMessagePrefix: 'redemptions',

        customGetRoute: true,
      });
    },
    { prefix: '/api/hasanat' },
  );

  await fastify.register(hasanatContractRouter);
}
