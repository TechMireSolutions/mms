import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { authenticateTenant } from '../../middleware/authenticate.js';
import { canDeleteCollection, canReadCollection, canWriteCollection } from '../../services/rbacService.js';
import {
  OBLIGATIONS_MODULE_MANIFEST,
  obligationTypeListSchema,
  mujtahidListSchema,
  mujtahidRepListSchema,
  wakalaTypeListSchema,
  obligationDistributionListSchema,
  obligationCollectionListSchema,
  computeObligationsCommandMetrics,
  type User,
} from '@mms/shared';
import { z } from 'zod';
import { registerBulkRoutes, registerMetricsRoute } from '../../lib/crudRouter.js';
import { registerColumnPreferencesRoutes } from '../../lib/columnPreferencesRouter.js';
import { parseRequest, replyValidationError } from '../../lib/zodRequest.js';
import { sendDatabaseError, sendForbidden, sendNotFound } from '../../lib/httpErrors.js';

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
} from '../../services/obligationService.js';

const OBLIGATIONS_COLLECTION = OBLIGATIONS_MODULE_MANIFEST.collectionKey;

const includeDeletedQuerySchema = z.object({
  includeDeleted: z.enum(['true', 'false']).optional(),
});

const bulkIdsSchema = z.object({
  ids: z.array(z.string().min(1)).min(1),
  deletionReason: z.string().optional(),
});

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

  fastify.get('/collections', async (request, reply) => {
    const user = request.user as User;
    if (!canReadCollection(user, OBLIGATIONS_COLLECTION)) return sendForbidden(reply);
    const parsed = parseRequest(includeDeletedQuerySchema, request.query);
    if (!parsed.ok) return replyValidationError(reply, parsed.message);
    const includeDeleted = parsed.data.includeDeleted === 'true';
    if (includeDeleted && !canDeleteCollection(user, OBLIGATIONS_COLLECTION)) {
      return sendForbidden(reply);
    }
    try {
      const collections = await loadObligationCollections({ includeDeleted });
      return reply.send({ collections });
    } catch {
      return sendDatabaseError(reply, 'Failed to load obligation collections');
    }
  });

  fastify.put('/collections/bulk', async (request, reply) => {
    const user = request.user as User;
    if (!canWriteCollection(user, OBLIGATIONS_COLLECTION)) return sendForbidden(reply);
    const parsed = parseRequest(obligationCollectionListSchema, request.body);
    if (!parsed.ok) return replyValidationError(reply, parsed.message);
    try {
      const collections = await upsertObligationCollections(parsed.data);
      return reply.send({ collections });
    } catch {
      return sendDatabaseError(reply, 'Failed to update obligation collections');
    }
  });

  fastify.delete<{ Params: { id: string } }>('/collections/:id', async (request, reply) => {
    const user = request.user as User;
    if (!canDeleteCollection(user, OBLIGATIONS_COLLECTION)) return sendForbidden(reply);
    try {
      const ok = await deleteObligationCollectionById(request.params.id, String(user.id));
      if (!ok) return sendNotFound(reply, 'Obligation collection not found');
      return reply.send({ success: true });
    } catch {
      return sendDatabaseError(reply, 'Failed to delete obligation collection');
    }
  });

  fastify.post<{ Params: { id: string } }>('/collections/:id/restore', async (request, reply) => {
    const user = request.user as User;
    if (!canDeleteCollection(user, OBLIGATIONS_COLLECTION)) return sendForbidden(reply);
    try {
      const ok = await restoreObligationCollectionById(request.params.id);
      if (!ok) return sendNotFound(reply, 'Obligation collection not found');
      return reply.send({ success: true });
    } catch {
      return sendDatabaseError(reply, 'Failed to restore obligation collection');
    }
  });

  fastify.post('/collections/bulk-delete', async (request, reply) => {
    const user = request.user as User;
    if (!canDeleteCollection(user, OBLIGATIONS_COLLECTION)) return sendForbidden(reply);
    const parsed = parseRequest(bulkIdsSchema, request.body);
    if (!parsed.ok) return replyValidationError(reply, parsed.message);
    try {
      const result = await bulkSoftDeleteObligationCollections(
        parsed.data.ids,
        String(user.id),
        parsed.data.deletionReason,
      );
      return reply.send({ success: true, ...result });
    } catch {
      return sendDatabaseError(reply, 'Failed to bulk delete obligation collections');
    }
  });

  fastify.post('/collections/bulk-restore', async (request, reply) => {
    const user = request.user as User;
    if (!canDeleteCollection(user, OBLIGATIONS_COLLECTION)) return sendForbidden(reply);
    const parsed = parseRequest(bulkIdsSchema, request.body);
    if (!parsed.ok) return replyValidationError(reply, parsed.message);
    try {
      const result = await bulkRestoreObligationCollections(parsed.data.ids);
      return reply.send({ success: true, ...result });
    } catch {
      return sendDatabaseError(reply, 'Failed to bulk restore obligation collections');
    }
  });

  registerColumnPreferencesRoutes(fastify, {
    path: '/column-preferences',
    collection: OBLIGATIONS_COLLECTION,
    objectKey: OBLIGATIONS_MODULE_MANIFEST.columnPreferencesObjectKey,
  });

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
}
