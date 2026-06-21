import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { authenticateTenant } from '../middleware/authenticate.js';
import { canReadCollection } from '../services/rbacService.js';
import type { User } from '@mms/shared';
import { FINANCE_MODULE_CONTRACT } from '@mms/shared';
import { sendForbidden } from '../lib/httpErrors.js';
import { moduleColumnPrefsBodySchema } from '../validation/moduleColumnPrefsSchemas.js';
import { parseRequest, replyValidationError } from '../lib/zodRequest.js';
import {
  getUserColumnPrefsForModule,
  setUserColumnPrefsForModule,
} from '../services/userColumnPrefsService.js';
import { loadFinanceCommandMetrics } from '../services/financeMetricsService.js';

const FINANCE_COLLECTION = FINANCE_MODULE_CONTRACT.collectionKey;

/**
 * Finance module routes — column prefs until invoice/payment REST CRUD ships.
 */
export default async function financeRoutes(
  fastify: FastifyInstance,
  _options: FastifyPluginOptions,
): Promise<void> {
  fastify.addHook('preHandler', authenticateTenant);

  fastify.get('/metrics', async (request, reply) => {
    const user = request.user as User;
    if (!canReadCollection(user, FINANCE_COLLECTION)) return sendForbidden(reply);
    try {
      return reply.send({ metrics: await loadFinanceCommandMetrics() });
    } catch {
      return reply.status(500).send({ type: 'database_error', message: 'Failed to load finance metrics' });
    }
  });

  fastify.get('/invoices/column-prefs', async (request, reply) => {
    const user = request.user as User;
    if (!canReadCollection(user, FINANCE_COLLECTION)) return sendForbidden(reply);
    try {
      const prefs = await getUserColumnPrefsForModule(
        FINANCE_MODULE_CONTRACT.invoiceColumnPrefsObjectKey,
        String(user.id),
      );
      return reply.send({ prefs });
    } catch {
      return reply.status(500).send({ type: 'database_error', message: 'Failed to load column preferences' });
    }
  });

  fastify.put('/invoices/column-prefs', async (request, reply) => {
    const user = request.user as User;
    if (!canReadCollection(user, FINANCE_COLLECTION)) return sendForbidden(reply);
    const parsed = parseRequest(moduleColumnPrefsBodySchema, request.body);
    if (!parsed.ok) return replyValidationError(reply, parsed.message);
    try {
      await setUserColumnPrefsForModule(
        FINANCE_MODULE_CONTRACT.invoiceColumnPrefsObjectKey,
        String(user.id),
        parsed.data.prefs,
      );
      return reply.send({ success: true, prefs: parsed.data.prefs });
    } catch {
      return reply.status(500).send({ type: 'database_error', message: 'Failed to save column preferences' });
    }
  });

  fastify.get('/payments/column-prefs', async (request, reply) => {
    const user = request.user as User;
    if (!canReadCollection(user, FINANCE_MODULE_CONTRACT.paymentCollectionKey)) return sendForbidden(reply);
    try {
      const prefs = await getUserColumnPrefsForModule(
        FINANCE_MODULE_CONTRACT.paymentColumnPrefsObjectKey,
        String(user.id),
      );
      return reply.send({ prefs });
    } catch {
      return reply.status(500).send({ type: 'database_error', message: 'Failed to load column preferences' });
    }
  });

  fastify.put('/payments/column-prefs', async (request, reply) => {
    const user = request.user as User;
    if (!canReadCollection(user, FINANCE_MODULE_CONTRACT.paymentCollectionKey)) return sendForbidden(reply);
    const parsed = parseRequest(moduleColumnPrefsBodySchema, request.body);
    if (!parsed.ok) return replyValidationError(reply, parsed.message);
    try {
      await setUserColumnPrefsForModule(
        FINANCE_MODULE_CONTRACT.paymentColumnPrefsObjectKey,
        String(user.id),
        parsed.data.prefs,
      );
      return reply.send({ success: true, prefs: parsed.data.prefs });
    } catch {
      return reply.status(500).send({ type: 'database_error', message: 'Failed to save column preferences' });
    }
  });
}
