import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { authenticateTenant } from '../middleware/authenticate.js';
import { canReadCollection } from '../services/rbacService.js';
import type { User } from '@mms/shared';
import { ENROLLMENTS_MODULE_CONTRACT } from '@mms/shared';
import { sendForbidden } from '../lib/httpErrors.js';
import { moduleColumnPrefsBodySchema } from '../validation/moduleColumnPrefsSchemas.js';
import { parseRequest, replyValidationError } from '../lib/zodRequest.js';
import {
  getUserColumnPrefsForModule,
  setUserColumnPrefsForModule,
} from '../services/userColumnPrefsService.js';
import { loadEnrollmentsCommandMetrics } from '../services/enrollmentsMetricsService.js';

const ENROLLMENTS_COLLECTION = ENROLLMENTS_MODULE_CONTRACT.collectionKey;

/**
 * Enrollments module routes — metrics + column prefs until REST CRUD ships.
 */
export default async function enrollmentsRoutes(
  fastify: FastifyInstance,
  _options: FastifyPluginOptions,
): Promise<void> {
  fastify.addHook('preHandler', authenticateTenant);

  fastify.get('/metrics', async (request, reply) => {
    const user = request.user as User;
    if (!canReadCollection(user, ENROLLMENTS_COLLECTION)) return sendForbidden(reply);
    try {
      return reply.send({ metrics: await loadEnrollmentsCommandMetrics() });
    } catch {
      return reply.status(500).send({ type: 'database_error', message: 'Failed to load enrollment metrics' });
    }
  });

  fastify.get('/column-prefs', async (request, reply) => {
    const user = request.user as User;
    if (!canReadCollection(user, ENROLLMENTS_COLLECTION)) return sendForbidden(reply);
    try {
      const prefs = await getUserColumnPrefsForModule(
        ENROLLMENTS_MODULE_CONTRACT.columnPrefsObjectKey,
        String(user.id),
      );
      return reply.send({ prefs });
    } catch {
      return reply.status(500).send({ type: 'database_error', message: 'Failed to load column preferences' });
    }
  });

  fastify.put('/column-prefs', async (request, reply) => {
    const user = request.user as User;
    if (!canReadCollection(user, ENROLLMENTS_COLLECTION)) return sendForbidden(reply);
    const parsed = parseRequest(moduleColumnPrefsBodySchema, request.body);
    if (!parsed.ok) return replyValidationError(reply, parsed.message);
    try {
      await setUserColumnPrefsForModule(
        ENROLLMENTS_MODULE_CONTRACT.columnPrefsObjectKey,
        String(user.id),
        parsed.data.prefs,
      );
      return reply.send({ success: true, prefs: parsed.data.prefs });
    } catch {
      return reply.status(500).send({ type: 'database_error', message: 'Failed to save column preferences' });
    }
  });
}
