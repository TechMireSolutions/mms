import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { authenticateTenant } from '../../middleware/authenticate.js';
import { canDeleteCollection, canReadCollection, canWriteCollection } from '../../services/rbacService.js';
import {
  HASANAT_MODULE_MANIFEST,
  denomListSchema,
  batchListSchema,
  distributionListSchema,
  redemptionListSchema,
  computeHasanatCommandMetrics,
  type User,
} from '@mms/shared';
import { z } from 'zod';
import { registerBulkRoutes, registerMetricsRoute } from '../../lib/crudRouter.js';
import { registerColumnPreferencesRoutes } from '../../lib/columnPreferencesRouter.js';
import { parseRequest, replyValidationError } from '../../lib/zodRequest.js';
import { sendDatabaseError, sendForbidden, sendNotFound } from '../../lib/httpErrors.js';
import {
  loadDenoms,
  upsertDenoms,
  loadBatches,
  upsertBatches,
  loadDistributions,
  upsertDistributions,
  loadRedemptions,
  upsertRedemptions,
  deleteDistributionById,
  restoreDistributionById,
  bulkSoftDeleteDistributions,
  bulkRestoreDistributions,
} from '../../services/hasanatService.js';

const HASANAT_DISTRIBUTIONS_COLLECTION = HASANAT_MODULE_MANIFEST.collectionKey;
const HASANAT_DENOMS_COLLECTION = HASANAT_MODULE_MANIFEST.denomCollectionKey;
const HASANAT_BATCHES_COLLECTION = HASANAT_MODULE_MANIFEST.batchCollectionKey;
const HASANAT_REDEMPTIONS_COLLECTION = HASANAT_MODULE_MANIFEST.redemptionCollectionKey;

const includeDeletedQuerySchema = z.object({
  includeDeleted: z.enum(['true', 'false']).optional(),
});

const bulkIdsSchema = z.object({
  ids: z.array(z.string().min(1)).min(1),
  deletionReason: z.string().optional(),
});

/**
 * Hasanat module routes — bulk upsert + soft-delete distributions.
 */
export default async function hasanatRoutes(
  fastify: FastifyInstance,
  _options: FastifyPluginOptions,
): Promise<void> {
  fastify.addHook('preHandler', authenticateTenant);

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

  fastify.get('/distributions', async (request, reply) => {
    const user = request.user as User;
    if (!canReadCollection(user, HASANAT_DISTRIBUTIONS_COLLECTION)) return sendForbidden(reply);
    const parsed = parseRequest(includeDeletedQuerySchema, request.query);
    if (!parsed.ok) return replyValidationError(reply, parsed.message);
    const includeDeleted = parsed.data.includeDeleted === 'true';
    if (includeDeleted && !canDeleteCollection(user, HASANAT_DISTRIBUTIONS_COLLECTION)) {
      return sendForbidden(reply);
    }
    try {
      const distributions = await loadDistributions({ includeDeleted });
      return reply.send({ distributions });
    } catch {
      return sendDatabaseError(reply, 'Failed to load distributions');
    }
  });

  fastify.put('/distributions/bulk', async (request, reply) => {
    const user = request.user as User;
    if (!canWriteCollection(user, HASANAT_DISTRIBUTIONS_COLLECTION)) return sendForbidden(reply);
    const parsed = parseRequest(distributionListSchema, request.body);
    if (!parsed.ok) return replyValidationError(reply, parsed.message);
    try {
      const distributions = await upsertDistributions(parsed.data);
      return reply.send({ distributions });
    } catch {
      return sendDatabaseError(reply, 'Failed to update distributions');
    }
  });

  fastify.delete<{ Params: { id: string } }>('/distributions/:id', async (request, reply) => {
    const user = request.user as User;
    if (!canDeleteCollection(user, HASANAT_DISTRIBUTIONS_COLLECTION)) return sendForbidden(reply);
    try {
      const ok = await deleteDistributionById(request.params.id, String(user.id));
      if (!ok) return sendNotFound(reply, 'Distribution not found');
      return reply.send({ success: true });
    } catch {
      return sendDatabaseError(reply, 'Failed to delete distribution');
    }
  });

  fastify.post<{ Params: { id: string } }>('/distributions/:id/restore', async (request, reply) => {
    const user = request.user as User;
    if (!canDeleteCollection(user, HASANAT_DISTRIBUTIONS_COLLECTION)) return sendForbidden(reply);
    try {
      const ok = await restoreDistributionById(request.params.id);
      if (!ok) return sendNotFound(reply, 'Distribution not found');
      return reply.send({ success: true });
    } catch {
      return sendDatabaseError(reply, 'Failed to restore distribution');
    }
  });

  fastify.post('/distributions/bulk-delete', async (request, reply) => {
    const user = request.user as User;
    if (!canDeleteCollection(user, HASANAT_DISTRIBUTIONS_COLLECTION)) return sendForbidden(reply);
    const parsed = parseRequest(bulkIdsSchema, request.body);
    if (!parsed.ok) return replyValidationError(reply, parsed.message);
    try {
      const result = await bulkSoftDeleteDistributions(
        parsed.data.ids,
        String(user.id),
        parsed.data.deletionReason,
      );
      return reply.send({ success: true, ...result });
    } catch {
      return sendDatabaseError(reply, 'Failed to bulk delete distributions');
    }
  });

  fastify.post('/distributions/bulk-restore', async (request, reply) => {
    const user = request.user as User;
    if (!canDeleteCollection(user, HASANAT_DISTRIBUTIONS_COLLECTION)) return sendForbidden(reply);
    const parsed = parseRequest(bulkIdsSchema, request.body);
    if (!parsed.ok) return replyValidationError(reply, parsed.message);
    try {
      const result = await bulkRestoreDistributions(parsed.data.ids);
      return reply.send({ success: true, ...result });
    } catch {
      return sendDatabaseError(reply, 'Failed to bulk restore distributions');
    }
  });

  registerColumnPreferencesRoutes(fastify, {
    path: '/distributions/column-preferences',
    collection: HASANAT_DISTRIBUTIONS_COLLECTION,
    objectKey: HASANAT_MODULE_MANIFEST.distributionColumnPreferencesObjectKey,
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
