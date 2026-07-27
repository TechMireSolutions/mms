import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { authenticateTenant } from '../../middleware/authenticate.js';
import { canDeleteCollection, canReadCollection, canWriteCollection } from '../../services/rbacService.js';
import {
  ACCOUNTING_MODULE_CONTRACT,
  accountListSchema,
  journalEntryListSchema,
  fiscalYearListSchema,
  computeAccountingCommandMetrics,
  type User,
} from '@mms/shared';
import { z } from 'zod';

import { registerBulkRoutes, registerMetricsRoute } from '../../lib/crudRouter.js';
import { registerColumnPreferencesRoutes } from '../../lib/columnPreferencesRouter.js';
import { parseRequest, replyValidationError } from '../../lib/zodRequest.js';
import { sendDatabaseError, sendForbidden, sendNotFound } from '../../lib/httpErrors.js';

import {
  loadAccounts,
  upsertAccounts,
  loadEntries,
  upsertEntries,
  loadFiscalYears,
  upsertFiscalYears,
  deleteJournalEntryById,
  restoreJournalEntryById,
  bulkSoftDeleteJournalEntries,
  bulkRestoreJournalEntries,
} from '../../services/accountingService.js';

const ACCOUNTING_ENTRIES_COLLECTION = ACCOUNTING_MODULE_CONTRACT.collectionKey;
const ACCOUNTING_ACCOUNTS_COLLECTION = ACCOUNTING_MODULE_CONTRACT.accountCollectionKey;
const ACCOUNTING_FISCAL_YEARS_COLLECTION = ACCOUNTING_MODULE_CONTRACT.fiscalYearCollectionKey;

const includeDeletedQuerySchema = z.object({
  includeDeleted: z.enum(['true', 'false']).optional(),
});

const bulkIdsSchema = z.object({
  ids: z.array(z.string().min(1)).min(1),
  deletionReason: z.string().optional(),
});

/**
 * Accounting module routes — bulk upsert collections + journal soft-delete.
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
    const parsed = parseRequest(includeDeletedQuerySchema, request.query);
    if (!parsed.ok) return replyValidationError(reply, parsed.message);
    const includeDeleted = parsed.data.includeDeleted === 'true';
    if (includeDeleted && !canDeleteCollection(user, ACCOUNTING_ACCOUNTS_COLLECTION)) {
      return sendForbidden(reply);
    }
    try {
      const accounts = await loadAccounts({ includeDeleted });
      return reply.send({ accounts });
    } catch {
      return sendDatabaseError(reply, 'Failed to load accounts');
    }
  });

  fastify.put('/accounts/bulk', async (request, reply) => {
    const user = request.user as User;
    if (!canWriteCollection(user, ACCOUNTING_ACCOUNTS_COLLECTION)) return sendForbidden(reply);
    const parsed = parseRequest(accountListSchema, request.body);
    if (!parsed.ok) return replyValidationError(reply, parsed.message);
    try {
      const accounts = await upsertAccounts(parsed.data);
      return reply.send({ accounts });
    } catch {
      return sendDatabaseError(reply, 'Failed to update accounts');
    }
  });

  registerColumnPreferencesRoutes(fastify, {
    path: '/accounts/column-preferences',
    collection: ACCOUNTING_ACCOUNTS_COLLECTION,
    objectKey: ACCOUNTING_MODULE_CONTRACT.accountColumnPreferencesObjectKey,
  });

  // --- Entries ---
  fastify.get('/entries', async (request, reply) => {
    const user = request.user as User;
    if (!canReadCollection(user, ACCOUNTING_ENTRIES_COLLECTION)) return sendForbidden(reply);
    const parsed = parseRequest(includeDeletedQuerySchema, request.query);
    if (!parsed.ok) return replyValidationError(reply, parsed.message);
    const includeDeleted = parsed.data.includeDeleted === 'true';
    if (includeDeleted && !canDeleteCollection(user, ACCOUNTING_ENTRIES_COLLECTION)) {
      return sendForbidden(reply);
    }
    try {
      const entries = await loadEntries({ includeDeleted });
      return reply.send({ entries });
    } catch {
      return sendDatabaseError(reply, 'Failed to load entries');
    }
  });

  fastify.put('/entries/bulk', async (request, reply) => {
    const user = request.user as User;
    if (!canWriteCollection(user, ACCOUNTING_ENTRIES_COLLECTION)) return sendForbidden(reply);
    const parsed = parseRequest(journalEntryListSchema, request.body);
    if (!parsed.ok) return replyValidationError(reply, parsed.message);
    try {
      const entries = await upsertEntries(parsed.data);
      return reply.send({ entries });
    } catch {
      return sendDatabaseError(reply, 'Failed to update entries');
    }
  });

  fastify.delete<{ Params: { id: string } }>('/entries/:id', async (request, reply) => {
    const user = request.user as User;
    if (!canDeleteCollection(user, ACCOUNTING_ENTRIES_COLLECTION)) return sendForbidden(reply);
    try {
      const ok = await deleteJournalEntryById(request.params.id, String(user.id));
      if (!ok) return sendNotFound(reply, 'Journal entry not found');
      return reply.send({ success: true });
    } catch (error: unknown) {
      if (error instanceof Error && error.message.includes('Posted')) {
        return reply.status(400).send({ error: error.message });
      }
      return sendDatabaseError(reply, 'Failed to delete journal entry');
    }
  });

  fastify.post<{ Params: { id: string } }>('/entries/:id/restore', async (request, reply) => {
    const user = request.user as User;
    if (!canDeleteCollection(user, ACCOUNTING_ENTRIES_COLLECTION)) return sendForbidden(reply);
    try {
      const ok = await restoreJournalEntryById(request.params.id);
      if (!ok) return sendNotFound(reply, 'Journal entry not found');
      return reply.send({ success: true });
    } catch {
      return sendDatabaseError(reply, 'Failed to restore journal entry');
    }
  });

  fastify.post('/entries/bulk-delete', async (request, reply) => {
    const user = request.user as User;
    if (!canDeleteCollection(user, ACCOUNTING_ENTRIES_COLLECTION)) return sendForbidden(reply);
    const parsed = parseRequest(bulkIdsSchema, request.body);
    if (!parsed.ok) return replyValidationError(reply, parsed.message);
    try {
      const result = await bulkSoftDeleteJournalEntries(
        parsed.data.ids,
        String(user.id),
        parsed.data.deletionReason,
      );
      return reply.send({ success: true, ...result });
    } catch {
      return sendDatabaseError(reply, 'Failed to bulk delete journal entries');
    }
  });

  fastify.post('/entries/bulk-restore', async (request, reply) => {
    const user = request.user as User;
    if (!canDeleteCollection(user, ACCOUNTING_ENTRIES_COLLECTION)) return sendForbidden(reply);
    const parsed = parseRequest(bulkIdsSchema, request.body);
    if (!parsed.ok) return replyValidationError(reply, parsed.message);
    try {
      const result = await bulkRestoreJournalEntries(parsed.data.ids);
      return reply.send({ success: true, ...result });
    } catch {
      return sendDatabaseError(reply, 'Failed to bulk restore journal entries');
    }
  });

  registerColumnPreferencesRoutes(fastify, {
    path: '/journal/column-preferences',
    collection: ACCOUNTING_ENTRIES_COLLECTION,
    objectKey: ACCOUNTING_MODULE_CONTRACT.journalColumnPreferencesObjectKey,
  });

  // --- Fiscal Years ---
  registerBulkRoutes(fastify, {
    path: '/fiscal-years',
    collection: ACCOUNTING_FISCAL_YEARS_COLLECTION,
    schema: fiscalYearListSchema,
    loadFn: loadFiscalYears,
    saveFn: upsertFiscalYears,
    responseKey: 'fiscalYears',
    errorMessagePrefix: 'fiscal years',
  });

  // --- Metrics ---
  registerMetricsRoute(fastify, {
    collection: ACCOUNTING_ENTRIES_COLLECTION,
    loadMetricsFn: async () => {
      const entries = await loadEntries();
      const accounts = await loadAccounts();
      return computeAccountingCommandMetrics(
        entries as Array<{ status?: string; date?: string; lines?: Array<{ debit?: number; credit?: number }> }>,
        accounts as Array<{ isActive?: boolean }>,
      );
    },
    errorMessagePrefix: 'accounting',
  });
}
