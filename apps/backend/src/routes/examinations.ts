import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { authenticateTenant } from '../middleware/authenticate.js';
import { canReadCollection } from '../services/rbacService.js';
import type { User } from '@mms/shared';
import { EXAMINATIONS_MODULE_CONTRACT } from '@mms/shared';
import { sendForbidden } from '../lib/httpErrors.js';
import { moduleColumnPrefsBodySchema } from '../validation/moduleColumnPrefsSchemas.js';
import { parseRequest, replyValidationError } from '../lib/zodRequest.js';
import {
  getUserColumnPrefsForModule,
  setUserColumnPrefsForModule,
} from '../services/userColumnPrefsService.js';
import { loadExaminationsCommandMetrics } from '../services/examinationsMetricsService.js';

const EXAMS_COLLECTION = EXAMINATIONS_MODULE_CONTRACT.collectionKey;

/**
 * Examinations module routes — metrics + column prefs until REST CRUD ships.
 */
export default async function examinationsRoutes(
  fastify: FastifyInstance,
  _options: FastifyPluginOptions,
): Promise<void> {
  fastify.addHook('preHandler', authenticateTenant);

  fastify.get('/metrics', async (request, reply) => {
    const user = request.user as User;
    if (!canReadCollection(user, EXAMS_COLLECTION)) return sendForbidden(reply);
    try {
      return reply.send({ metrics: await loadExaminationsCommandMetrics() });
    } catch {
      return reply.status(500).send({ type: 'database_error', message: 'Failed to load examination metrics' });
    }
  });

  fastify.get('/exams/column-prefs', async (request, reply) => {
    const user = request.user as User;
    if (!canReadCollection(user, EXAMS_COLLECTION)) return sendForbidden(reply);
    try {
      const prefs = await getUserColumnPrefsForModule(
        EXAMINATIONS_MODULE_CONTRACT.examColumnPrefsObjectKey,
        String(user.id),
      );
      return reply.send({ prefs });
    } catch {
      return reply.status(500).send({ type: 'database_error', message: 'Failed to load column preferences' });
    }
  });

  fastify.put('/exams/column-prefs', async (request, reply) => {
    const user = request.user as User;
    if (!canReadCollection(user, EXAMS_COLLECTION)) return sendForbidden(reply);
    const parsed = parseRequest(moduleColumnPrefsBodySchema, request.body);
    if (!parsed.ok) return replyValidationError(reply, parsed.message);
    try {
      await setUserColumnPrefsForModule(
        EXAMINATIONS_MODULE_CONTRACT.examColumnPrefsObjectKey,
        String(user.id),
        parsed.data.prefs,
      );
      return reply.send({ success: true, prefs: parsed.data.prefs });
    } catch {
      return reply.status(500).send({ type: 'database_error', message: 'Failed to save column preferences' });
    }
  });

  fastify.get('/results/column-prefs', async (request, reply) => {
    const user = request.user as User;
    if (!canReadCollection(user, EXAMINATIONS_MODULE_CONTRACT.resultsCollectionKey)) return sendForbidden(reply);
    try {
      const prefs = await getUserColumnPrefsForModule(
        EXAMINATIONS_MODULE_CONTRACT.resultsColumnPrefsObjectKey,
        String(user.id),
      );
      return reply.send({ prefs });
    } catch {
      return reply.status(500).send({ type: 'database_error', message: 'Failed to load column preferences' });
    }
  });

  fastify.put('/results/column-prefs', async (request, reply) => {
    const user = request.user as User;
    if (!canReadCollection(user, EXAMINATIONS_MODULE_CONTRACT.resultsCollectionKey)) return sendForbidden(reply);
    const parsed = parseRequest(moduleColumnPrefsBodySchema, request.body);
    if (!parsed.ok) return replyValidationError(reply, parsed.message);
    try {
      await setUserColumnPrefsForModule(
        EXAMINATIONS_MODULE_CONTRACT.resultsColumnPrefsObjectKey,
        String(user.id),
        parsed.data.prefs,
      );
      return reply.send({ success: true, prefs: parsed.data.prefs });
    } catch {
      return reply.status(500).send({ type: 'database_error', message: 'Failed to save column preferences' });
    }
  });
}
