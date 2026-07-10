import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { authenticateTenant } from '../../middleware/authenticate.js';
import { canReadCollection, canWriteCollection } from '../../services/rbacService.js';
import type { User } from '@mms/shared';
import { ACCOUNTING_MODULE_CONTRACT } from '@mms/shared';
import { sendForbidden } from '../../lib/httpErrors.js';
import { registerColumnPreferencesRoutes } from '../../lib/columnPreferencesRouter.js';
import { parseRequest, replyValidationError } from '../../lib/zodRequest.js';

import { loadAccountingCommandMetrics } from '../../services/accountingMetricsService.js';
import {
  loadAccounts,
  replaceAccounts,
  loadEntries,
  replaceEntries,
  loadFiscalYears,
  replaceFiscalYears,
} from '../../services/accountingService.js';
import {
  accountListSchema,
  journalEntryListSchema,
  fiscalYearListSchema,
} from '../../validation/accountingSchemas.js';

const ACCOUNTING_ENTRIES_COLLECTION = ACCOUNTING_MODULE_CONTRACT.collectionKey;
const ACCOUNTING_ACCOUNTS_COLLECTION = ACCOUNTING_MODULE_CONTRACT.accountCollectionKey;
const ACCOUNTING_FISCAL_YEARS_COLLECTION = ACCOUNTING_MODULE_CONTRACT.fiscalYearCollectionKey;

/**
 * Accounting module routes — metrics + column preferences until REST CRUD ships.
 */
export default async function accountingRoutes(
  fastify: FastifyInstance,
  _options: FastifyPluginOptions,
): Promise<void> {
  fastify.addHook('preHandler', authenticateTenant);

  // --- Accounts ---
  fastify.get('/accounts', async (request, reply) => {
    const user = request.user as User;
    if (!canReadCollection(user, ACCOUNTING_ACCOUNTS_COLLECTION)) return sendForbidden(reply);
    try {
      return reply.send({ accounts: await loadAccounts() });
    } catch {
      return reply.status(500).send({ type: 'database_error', message: 'Failed to load accounts' });
    }
  });

  fastify.put('/accounts/bulk', async (request, reply) => {
    const user = request.user as User;
    if (!canWriteCollection(user, ACCOUNTING_ACCOUNTS_COLLECTION)) return sendForbidden(reply);
    const parsed = parseRequest(accountListSchema, request.body);
    if (!parsed.ok) return replyValidationError(reply, parsed.message);
    try {
      const accounts = await replaceAccounts(parsed.data);
      return reply.send({ accounts });
    } catch {
      return reply.status(500).send({ type: 'database_error', message: 'Failed to update accounts' });
    }
  });

  // --- Entries ---
  fastify.get('/entries', async (request, reply) => {
    const user = request.user as User;
    if (!canReadCollection(user, ACCOUNTING_ENTRIES_COLLECTION)) return sendForbidden(reply);
    try {
      return reply.send({ entries: await loadEntries() });
    } catch {
      return reply.status(500).send({ type: 'database_error', message: 'Failed to load journal entries' });
    }
  });

  fastify.put('/entries/bulk', async (request, reply) => {
    const user = request.user as User;
    if (!canWriteCollection(user, ACCOUNTING_ENTRIES_COLLECTION)) return sendForbidden(reply);
    const parsed = parseRequest(journalEntryListSchema, request.body);
    if (!parsed.ok) return replyValidationError(reply, parsed.message);
    try {
      const entries = await replaceEntries(parsed.data);
      return reply.send({ entries });
    } catch {
      return reply.status(500).send({ type: 'database_error', message: 'Failed to update journal entries' });
    }
  });

  // --- Fiscal Years ---
  fastify.get('/fiscal-years', async (request, reply) => {
    const user = request.user as User;
    if (!canReadCollection(user, ACCOUNTING_FISCAL_YEARS_COLLECTION)) return sendForbidden(reply);
    try {
      return reply.send({ fiscalYears: await loadFiscalYears() });
    } catch {
      return reply.status(500).send({ type: 'database_error', message: 'Failed to load fiscal years' });
    }
  });

  fastify.put('/fiscal-years/bulk', async (request, reply) => {
    const user = request.user as User;
    if (!canWriteCollection(user, ACCOUNTING_FISCAL_YEARS_COLLECTION)) return sendForbidden(reply);
    const parsed = parseRequest(fiscalYearListSchema, request.body);
    if (!parsed.ok) return replyValidationError(reply, parsed.message);
    try {
      const fiscalYears = await replaceFiscalYears(parsed.data);
      return reply.send({ fiscalYears });
    } catch {
      return reply.status(500).send({ type: 'database_error', message: 'Failed to update fiscal years' });
    }
  });

  fastify.get('/metrics', async (request, reply) => {
    const user = request.user as User;
    if (!canReadCollection(user, ACCOUNTING_ENTRIES_COLLECTION)) return sendForbidden(reply);
    try {
      return reply.send({ metrics: await loadAccountingCommandMetrics() });
    } catch {
      return reply.status(500).send({ type: 'database_error', message: 'Failed to load accounting metrics' });
    }
  });

  // --- Column Preferences (both formats) ---
  registerColumnPreferencesRoutes(fastify, {
    path: '/journal/column-preferences',
    collection: ACCOUNTING_ENTRIES_COLLECTION,
    objectKey: ACCOUNTING_MODULE_CONTRACT.journalColumnPreferencesObjectKey,
  });
  registerColumnPreferencesRoutes(fastify, {
    path: '/journal/column-prefs',
    collection: ACCOUNTING_ENTRIES_COLLECTION,
    objectKey: ACCOUNTING_MODULE_CONTRACT.journalColumnPreferencesObjectKey,
  });

  registerColumnPreferencesRoutes(fastify, {
    path: '/accounts/column-preferences',
    collection: ACCOUNTING_MODULE_CONTRACT.accountCollectionKey,
    objectKey: ACCOUNTING_MODULE_CONTRACT.accountColumnPreferencesObjectKey,
  });
  registerColumnPreferencesRoutes(fastify, {
    path: '/accounts/column-prefs',
    collection: ACCOUNTING_MODULE_CONTRACT.accountCollectionKey,
    objectKey: ACCOUNTING_MODULE_CONTRACT.accountColumnPreferencesObjectKey,
  });
}
