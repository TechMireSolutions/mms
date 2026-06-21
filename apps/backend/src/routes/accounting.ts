import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { authenticateTenant } from '../middleware/authenticate.js';
import { canReadCollection } from '../services/rbacService.js';
import type { User } from '@mms/shared';
import { ACCOUNTING_MODULE_CONTRACT } from '@mms/shared';
import { sendForbidden } from '../lib/httpErrors.js';
import { moduleColumnPrefsBodySchema } from '../validation/moduleColumnPrefsSchemas.js';
import { parseRequest, replyValidationError } from '../lib/zodRequest.js';
import {
  getUserColumnPrefsForModule,
  setUserColumnPrefsForModule,
} from '../services/userColumnPrefsService.js';
import { loadAccountingCommandMetrics } from '../services/accountingMetricsService.js';

const ACCOUNTING_ENTRIES_COLLECTION = ACCOUNTING_MODULE_CONTRACT.collectionKey;

/**
 * Accounting module routes — metrics + column prefs until REST CRUD ships.
 */
export default async function accountingRoutes(
  fastify: FastifyInstance,
  _options: FastifyPluginOptions,
): Promise<void> {
  fastify.addHook('preHandler', authenticateTenant);

  fastify.get('/metrics', async (request, reply) => {
    const user = request.user as User;
    if (!canReadCollection(user, ACCOUNTING_ENTRIES_COLLECTION)) return sendForbidden(reply);
    try {
      return reply.send({ metrics: await loadAccountingCommandMetrics() });
    } catch {
      return reply.status(500).send({ type: 'database_error', message: 'Failed to load accounting metrics' });
    }
  });

  fastify.get('/journal/column-prefs', async (request, reply) => {
    const user = request.user as User;
    if (!canReadCollection(user, ACCOUNTING_ENTRIES_COLLECTION)) return sendForbidden(reply);
    try {
      const prefs = await getUserColumnPrefsForModule(
        ACCOUNTING_MODULE_CONTRACT.journalColumnPrefsObjectKey,
        String(user.id),
      );
      return reply.send({ prefs });
    } catch {
      return reply.status(500).send({ type: 'database_error', message: 'Failed to load column preferences' });
    }
  });

  fastify.put('/journal/column-prefs', async (request, reply) => {
    const user = request.user as User;
    if (!canReadCollection(user, ACCOUNTING_ENTRIES_COLLECTION)) return sendForbidden(reply);
    const parsed = parseRequest(moduleColumnPrefsBodySchema, request.body);
    if (!parsed.ok) return replyValidationError(reply, parsed.message);
    try {
      await setUserColumnPrefsForModule(
        ACCOUNTING_MODULE_CONTRACT.journalColumnPrefsObjectKey,
        String(user.id),
        parsed.data.prefs,
      );
      return reply.send({ success: true, prefs: parsed.data.prefs });
    } catch {
      return reply.status(500).send({ type: 'database_error', message: 'Failed to save column preferences' });
    }
  });

  fastify.get('/accounts/column-prefs', async (request, reply) => {
    const user = request.user as User;
    if (!canReadCollection(user, ACCOUNTING_MODULE_CONTRACT.accountCollectionKey)) return sendForbidden(reply);
    try {
      const prefs = await getUserColumnPrefsForModule(
        ACCOUNTING_MODULE_CONTRACT.accountColumnPrefsObjectKey,
        String(user.id),
      );
      return reply.send({ prefs });
    } catch {
      return reply.status(500).send({ type: 'database_error', message: 'Failed to load column preferences' });
    }
  });

  fastify.put('/accounts/column-prefs', async (request, reply) => {
    const user = request.user as User;
    if (!canReadCollection(user, ACCOUNTING_MODULE_CONTRACT.accountCollectionKey)) return sendForbidden(reply);
    const parsed = parseRequest(moduleColumnPrefsBodySchema, request.body);
    if (!parsed.ok) return replyValidationError(reply, parsed.message);
    try {
      await setUserColumnPrefsForModule(
        ACCOUNTING_MODULE_CONTRACT.accountColumnPrefsObjectKey,
        String(user.id),
        parsed.data.prefs,
      );
      return reply.send({ success: true, prefs: parsed.data.prefs });
    } catch {
      return reply.status(500).send({ type: 'database_error', message: 'Failed to save column preferences' });
    }
  });
}
