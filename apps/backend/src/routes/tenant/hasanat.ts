import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { authenticateTenant } from '../../middleware/authenticate.js';
import { canReadCollection, canWriteCollection } from '../../services/rbacService.js';
import type { User } from '@mms/shared';
import { HASANAT_MODULE_CONTRACT } from '@mms/shared';
import { sendForbidden } from '../../lib/httpErrors.js';
import { registerColumnPreferencesRoutes } from '../../lib/columnPreferencesRouter.js';
import { parseRequest, replyValidationError } from '../../lib/zodRequest.js';

import { loadHasanatCommandMetrics } from '../../services/hasanatMetricsService.js';
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
import {
  denomListSchema,
  batchListSchema,
  distributionListSchema,
  redemptionListSchema,
} from '../../validation/hasanatSchemas.js';

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
  fastify.get('/metrics', async (request, reply) => {
    const user = request.user as User;
    if (!canReadCollection(user, HASANAT_DISTRIBUTIONS_COLLECTION)) return sendForbidden(reply);
    try {
      return reply.send({ metrics: await loadHasanatCommandMetrics() });
    } catch {
      return reply.status(500).send({ type: 'database_error', message: 'Failed to load hasanat metrics' });
    }
  });

  // --- Denominations ---
  fastify.get('/denoms', async (request, reply) => {
    const user = request.user as User;
    if (!canReadCollection(user, HASANAT_DENOMS_COLLECTION)) return sendForbidden(reply);
    try {
      return reply.send({ denoms: await loadDenoms() });
    } catch {
      return reply.status(500).send({ type: 'database_error', message: 'Failed to load denominations' });
    }
  });

  fastify.put('/denoms/bulk', async (request, reply) => {
    const user = request.user as User;
    if (!canWriteCollection(user, HASANAT_DENOMS_COLLECTION)) return sendForbidden(reply);
    const parsed = parseRequest(denomListSchema, request.body);
    if (!parsed.ok) return replyValidationError(reply, parsed.message);
    try {
      const denoms = await replaceDenoms(parsed.data);
      return reply.send({ denoms });
    } catch {
      return reply.status(500).send({ type: 'database_error', message: 'Failed to update denominations' });
    }
  });

  // --- Batches ---
  fastify.get('/batches', async (request, reply) => {
    const user = request.user as User;
    if (!canReadCollection(user, HASANAT_BATCHES_COLLECTION)) return sendForbidden(reply);
    try {
      return reply.send({ batches: await loadBatches() });
    } catch {
      return reply.status(500).send({ type: 'database_error', message: 'Failed to load batches' });
    }
  });

  fastify.put('/batches/bulk', async (request, reply) => {
    const user = request.user as User;
    if (!canWriteCollection(user, HASANAT_BATCHES_COLLECTION)) return sendForbidden(reply);
    const parsed = parseRequest(batchListSchema, request.body);
    if (!parsed.ok) return replyValidationError(reply, parsed.message);
    try {
      const batches = await replaceBatches(parsed.data);
      return reply.send({ batches });
    } catch {
      return reply.status(500).send({ type: 'database_error', message: 'Failed to update batches' });
    }
  });

  // --- Distributions ---
  fastify.get('/distributions', async (request, reply) => {
    const user = request.user as User;
    if (!canReadCollection(user, HASANAT_DISTRIBUTIONS_COLLECTION)) return sendForbidden(reply);
    try {
      return reply.send({ distributions: await loadDistributions() });
    } catch {
      return reply.status(500).send({ type: 'database_error', message: 'Failed to load distributions' });
    }
  });

  fastify.put('/distributions/bulk', async (request, reply) => {
    const user = request.user as User;
    if (!canWriteCollection(user, HASANAT_DISTRIBUTIONS_COLLECTION)) return sendForbidden(reply);
    const parsed = parseRequest(distributionListSchema, request.body);
    if (!parsed.ok) return replyValidationError(reply, parsed.message);
    try {
      const distributions = await replaceDistributions(parsed.data);
      return reply.send({ distributions });
    } catch {
      return reply.status(500).send({ type: 'database_error', message: 'Failed to update distributions' });
    }
  });

  // --- Redemptions ---
  fastify.get('/redemptions', async (request, reply) => {
    const user = request.user as User;
    if (!canReadCollection(user, HASANAT_REDEMPTIONS_COLLECTION)) return sendForbidden(reply);
    try {
      return reply.send({ redemptions: await loadRedemptions() });
    } catch {
      return reply.status(500).send({ type: 'database_error', message: 'Failed to load redemptions' });
    }
  });

  fastify.put('/redemptions/bulk', async (request, reply) => {
    const user = request.user as User;
    if (!canWriteCollection(user, HASANAT_REDEMPTIONS_COLLECTION)) return sendForbidden(reply);
    const parsed = parseRequest(redemptionListSchema, request.body);
    if (!parsed.ok) return replyValidationError(reply, parsed.message);
    try {
      const redemptions = await replaceRedemptions(parsed.data);
      return reply.send({ redemptions });
    } catch {
      return reply.status(500).send({ type: 'database_error', message: 'Failed to update redemptions' });
    }
  });

  registerColumnPreferencesRoutes(fastify, {
    path: '/distributions/column-preferences',
    collection: HASANAT_DISTRIBUTIONS_COLLECTION,
    objectKey: HASANAT_MODULE_CONTRACT.distributionColumnPreferencesObjectKey,
  });

  registerColumnPreferencesRoutes(fastify, {
    path: '/redemptions/column-preferences',
    collection: HASANAT_REDEMPTIONS_COLLECTION,
    objectKey: HASANAT_MODULE_CONTRACT.redemptionColumnPreferencesObjectKey,
  });
}

