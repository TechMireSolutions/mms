import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { authenticateTenant } from '../../middleware/authenticate.js';
import { canReadCollection, canWriteCollection } from '../../services/rbacService.js';
import type { User } from '@mms/shared';
import { OBLIGATIONS_MODULE_CONTRACT } from '@mms/shared';
import { sendForbidden } from '../../lib/httpErrors.js';
import { registerColumnPreferencesRoutes } from '../../lib/columnPreferencesRouter.js';
import { parseRequest, replyValidationError } from '../../lib/zodRequest.js';

import { loadObligationsCommandMetrics } from '../../services/obligationsMetricsService.js';
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
import {
  obligationTypeListSchema,
  mujtahidListSchema,
  mujtahidRepListSchema,
  wakalaTypeListSchema,
  obligationDistributionListSchema,
  obligationCollectionListSchema,
} from '../../validation/obligationSchemas.js';

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
  fastify.get('/types', async (request, reply) => {
    const user = request.user as User;
    if (!canReadCollection(user, OBLIGATIONS_COLLECTION)) return sendForbidden(reply);
    try {
      return reply.send({ types: await loadObligationTypes() });
    } catch {
      return reply.status(500).send({ type: 'database_error', message: 'Failed to load obligation types' });
    }
  });

  fastify.put('/types/bulk', async (request, reply) => {
    const user = request.user as User;
    if (!canWriteCollection(user, OBLIGATIONS_COLLECTION)) return sendForbidden(reply);
    const parsed = parseRequest(obligationTypeListSchema, request.body);
    if (!parsed.ok) return replyValidationError(reply, parsed.message);
    try {
      const types = await replaceObligationTypes(parsed.data);
      return reply.send({ types });
    } catch {
      return reply.status(500).send({ type: 'database_error', message: 'Failed to update obligation types' });
    }
  });

  // --- Mujtahids ---
  fastify.get('/mujtahids', async (request, reply) => {
    const user = request.user as User;
    if (!canReadCollection(user, OBLIGATIONS_COLLECTION)) return sendForbidden(reply);
    try {
      return reply.send({ mujtahids: await loadMujtahids() });
    } catch {
      return reply.status(500).send({ type: 'database_error', message: 'Failed to load mujtahids' });
    }
  });

  fastify.put('/mujtahids/bulk', async (request, reply) => {
    const user = request.user as User;
    if (!canWriteCollection(user, OBLIGATIONS_COLLECTION)) return sendForbidden(reply);
    const parsed = parseRequest(mujtahidListSchema, request.body);
    if (!parsed.ok) return replyValidationError(reply, parsed.message);
    try {
      const mujtahids = await replaceMujtahids(parsed.data);
      return reply.send({ mujtahids });
    } catch {
      return reply.status(500).send({ type: 'database_error', message: 'Failed to update mujtahids' });
    }
  });

  // --- Mujtahid Reps ---
  fastify.get('/reps', async (request, reply) => {
    const user = request.user as User;
    if (!canReadCollection(user, OBLIGATIONS_COLLECTION)) return sendForbidden(reply);
    try {
      return reply.send({ reps: await loadMujtahidReps() });
    } catch {
      return reply.status(500).send({ type: 'database_error', message: 'Failed to load mujtahid reps' });
    }
  });

  fastify.put('/reps/bulk', async (request, reply) => {
    const user = request.user as User;
    if (!canWriteCollection(user, OBLIGATIONS_COLLECTION)) return sendForbidden(reply);
    const parsed = parseRequest(mujtahidRepListSchema, request.body);
    if (!parsed.ok) return replyValidationError(reply, parsed.message);
    try {
      const reps = await replaceMujtahidReps(parsed.data);
      return reply.send({ reps });
    } catch {
      return reply.status(500).send({ type: 'database_error', message: 'Failed to update mujtahid reps' });
    }
  });

  // --- Wakala Types ---
  fastify.get('/wakala', async (request, reply) => {
    const user = request.user as User;
    if (!canReadCollection(user, OBLIGATIONS_COLLECTION)) return sendForbidden(reply);
    try {
      return reply.send({ wakalaTypes: await loadWakalaTypes() });
    } catch {
      return reply.status(500).send({ type: 'database_error', message: 'Failed to load wakala types' });
    }
  });

  fastify.put('/wakala/bulk', async (request, reply) => {
    const user = request.user as User;
    if (!canWriteCollection(user, OBLIGATIONS_COLLECTION)) return sendForbidden(reply);
    const parsed = parseRequest(wakalaTypeListSchema, request.body);
    if (!parsed.ok) return replyValidationError(reply, parsed.message);
    try {
      const wakalaTypes = await replaceWakalaTypes(parsed.data);
      return reply.send({ wakalaTypes });
    } catch {
      return reply.status(500).send({ type: 'database_error', message: 'Failed to update wakala types' });
    }
  });

  // --- Obligation Distributions ---
  fastify.get('/distributions', async (request, reply) => {
    const user = request.user as User;
    if (!canReadCollection(user, OBLIGATIONS_COLLECTION)) return sendForbidden(reply);
    try {
      return reply.send({ distributions: await loadObligationDistributions() });
    } catch {
      return reply.status(500).send({ type: 'database_error', message: 'Failed to load obligation distributions' });
    }
  });

  fastify.put('/distributions/bulk', async (request, reply) => {
    const user = request.user as User;
    if (!canWriteCollection(user, OBLIGATIONS_COLLECTION)) return sendForbidden(reply);
    const parsed = parseRequest(obligationDistributionListSchema, request.body);
    if (!parsed.ok) return replyValidationError(reply, parsed.message);
    try {
      const distributions = await replaceObligationDistributions(parsed.data);
      return reply.send({ distributions });
    } catch {
      return reply.status(500).send({ type: 'database_error', message: 'Failed to update obligation distributions' });
    }
  });

  // --- Obligation Collections ---
  fastify.get('/collections', async (request, reply) => {
    const user = request.user as User;
    if (!canReadCollection(user, OBLIGATIONS_COLLECTION)) return sendForbidden(reply);
    try {
      return reply.send({ collections: await loadObligationCollections() });
    } catch {
      return reply.status(500).send({ type: 'database_error', message: 'Failed to load obligation collections' });
    }
  });

  fastify.put('/collections/bulk', async (request, reply) => {
    const user = request.user as User;
    if (!canWriteCollection(user, OBLIGATIONS_COLLECTION)) return sendForbidden(reply);
    const parsed = parseRequest(obligationCollectionListSchema, request.body);
    if (!parsed.ok) return replyValidationError(reply, parsed.message);
    try {
      const collections = await replaceObligationCollections(parsed.data);
      return reply.send({ collections });
    } catch {
      return reply.status(500).send({ type: 'database_error', message: 'Failed to update obligation collections' });
    }
  });

  fastify.get('/metrics', async (request, reply) => {
    const user = request.user as User;
    if (!canReadCollection(user, OBLIGATIONS_COLLECTION)) return sendForbidden(reply);
    try {
      return reply.send({ metrics: await loadObligationsCommandMetrics() });
    } catch {
      return reply.status(500).send({ type: 'database_error', message: 'Failed to load obligation metrics' });
    }
  });

  registerColumnPreferencesRoutes(fastify, {
    collection: OBLIGATIONS_COLLECTION,
    objectKey: OBLIGATIONS_MODULE_CONTRACT.columnPreferencesObjectKey,
  });
}
