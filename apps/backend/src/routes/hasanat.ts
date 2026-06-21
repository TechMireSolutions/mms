import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { authenticateTenant } from '../middleware/authenticate.js';
import { canReadCollection } from '../services/rbacService.js';
import type { User } from '@mms/shared';
import { HASANAT_MODULE_CONTRACT } from '@mms/shared';
import { sendForbidden } from '../lib/httpErrors.js';
import { moduleColumnPrefsBodySchema } from '../validation/moduleColumnPrefsSchemas.js';
import { parseRequest, replyValidationError } from '../lib/zodRequest.js';
import {
  getUserColumnPrefsForModule,
  setUserColumnPrefsForModule,
} from '../services/userColumnPrefsService.js';
import { loadHasanatCommandMetrics } from '../services/hasanatMetricsService.js';

const HASANAT_DISTRIBUTIONS_COLLECTION = HASANAT_MODULE_CONTRACT.collectionKey;

/**
 * Hasanat module routes — metrics + column prefs until REST CRUD ships.
 */
export default async function hasanatRoutes(
  fastify: FastifyInstance,
  _options: FastifyPluginOptions,
): Promise<void> {
  fastify.addHook('preHandler', authenticateTenant);

  fastify.get('/metrics', async (request, reply) => {
    const user = request.user as User;
    if (!canReadCollection(user, HASANAT_DISTRIBUTIONS_COLLECTION)) return sendForbidden(reply);
    try {
      return reply.send({ metrics: await loadHasanatCommandMetrics() });
    } catch {
      return reply.status(500).send({ type: 'database_error', message: 'Failed to load hasanat metrics' });
    }
  });

  fastify.get('/distributions/column-prefs', async (request, reply) => {
    const user = request.user as User;
    if (!canReadCollection(user, HASANAT_DISTRIBUTIONS_COLLECTION)) return sendForbidden(reply);
    try {
      const prefs = await getUserColumnPrefsForModule(
        HASANAT_MODULE_CONTRACT.distributionColumnPrefsObjectKey,
        String(user.id),
      );
      return reply.send({ prefs });
    } catch {
      return reply.status(500).send({ type: 'database_error', message: 'Failed to load column preferences' });
    }
  });

  fastify.put('/distributions/column-prefs', async (request, reply) => {
    const user = request.user as User;
    if (!canReadCollection(user, HASANAT_DISTRIBUTIONS_COLLECTION)) return sendForbidden(reply);
    const parsed = parseRequest(moduleColumnPrefsBodySchema, request.body);
    if (!parsed.ok) return replyValidationError(reply, parsed.message);
    try {
      await setUserColumnPrefsForModule(
        HASANAT_MODULE_CONTRACT.distributionColumnPrefsObjectKey,
        String(user.id),
        parsed.data.prefs,
      );
      return reply.send({ success: true, prefs: parsed.data.prefs });
    } catch {
      return reply.status(500).send({ type: 'database_error', message: 'Failed to save column preferences' });
    }
  });

  fastify.get('/redemptions/column-prefs', async (request, reply) => {
    const user = request.user as User;
    if (!canReadCollection(user, HASANAT_MODULE_CONTRACT.redemptionCollectionKey)) return sendForbidden(reply);
    try {
      const prefs = await getUserColumnPrefsForModule(
        HASANAT_MODULE_CONTRACT.redemptionColumnPrefsObjectKey,
        String(user.id),
      );
      return reply.send({ prefs });
    } catch {
      return reply.status(500).send({ type: 'database_error', message: 'Failed to load column preferences' });
    }
  });

  fastify.put('/redemptions/column-prefs', async (request, reply) => {
    const user = request.user as User;
    if (!canReadCollection(user, HASANAT_MODULE_CONTRACT.redemptionCollectionKey)) return sendForbidden(reply);
    const parsed = parseRequest(moduleColumnPrefsBodySchema, request.body);
    if (!parsed.ok) return replyValidationError(reply, parsed.message);
    try {
      await setUserColumnPrefsForModule(
        HASANAT_MODULE_CONTRACT.redemptionColumnPrefsObjectKey,
        String(user.id),
        parsed.data.prefs,
      );
      return reply.send({ success: true, prefs: parsed.data.prefs });
    } catch {
      return reply.status(500).send({ type: 'database_error', message: 'Failed to save column preferences' });
    }
  });
}
