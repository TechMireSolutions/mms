import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { authenticateTenant } from '../../middleware/authenticate.js';
import { requireTenantModule } from '../../middleware/requireTenantModule.js';
import {
  ACCOUNTING_MODULE_MANIFEST,
  accountListSchema,
  journalEntryListSchema,
  fiscalYearListSchema,
  computeAccountingCommandMetrics,
} from '@mms/shared';
import {
  registerBulkRoutes,
  registerIncludableBulkRoutes,
  registerMetricsRoute,
  registerSoftDeletableBulkRoutes,
} from '../../lib/crudRouter.js';

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
  loadAccountsPage,
  loadEntriesPage,
  loadFiscalYearsPage,
} from '../../services/accountingService.js';
import { accountingSetupConfigRoutes } from './accountingSetupConfigRoutes.js';

const ACCOUNTING_ENTRIES_COLLECTION = ACCOUNTING_MODULE_MANIFEST.collectionKey;
const ACCOUNTING_ACCOUNTS_COLLECTION = ACCOUNTING_MODULE_MANIFEST.accountCollectionKey;
const ACCOUNTING_FISCAL_YEARS_COLLECTION = ACCOUNTING_MODULE_MANIFEST.fiscalYearCollectionKey;

/**
 * Accounting module routes — bulk upsert collections + journal soft-delete.
 */
export default async function accountingRoutes(
  fastify: FastifyInstance,
  _options: FastifyPluginOptions,
): Promise<void> {
  fastify.addHook('preHandler', authenticateTenant);
  fastify.addHook('preHandler', requireTenantModule('accounting'));

  fastify.register(accountingSetupConfigRoutes);

  registerIncludableBulkRoutes(fastify, {
    path: '/accounts',
    collection: ACCOUNTING_ACCOUNTS_COLLECTION,
    schema: accountListSchema,
    loadFn: loadAccounts,
    loadPageFn: loadAccountsPage,
    saveFn: upsertAccounts,
    responseKey: 'accounts',
    errorMessagePrefix: 'accounts',
    columnPreferencesObjectKey: ACCOUNTING_MODULE_MANIFEST.accountColumnPreferencesObjectKey,
  });

  registerSoftDeletableBulkRoutes(fastify, {
    path: '/entries',
    collection: ACCOUNTING_ENTRIES_COLLECTION,
    schema: journalEntryListSchema,
    loadFn: loadEntries,
    loadPageFn: loadEntriesPage,
    saveFn: upsertEntries,
    deleteFn: deleteJournalEntryById,
    restoreFn: restoreJournalEntryById,
    bulkDeleteFn: bulkSoftDeleteJournalEntries,
    bulkRestoreFn: bulkRestoreJournalEntries,
    responseKey: 'entries',
    errorMessagePrefix: 'entries',
    nameSingular: 'Journal entry',
    columnPreferencesObjectKey: ACCOUNTING_MODULE_MANIFEST.journalColumnPreferencesObjectKey,
    columnPreferencesPath: '/journal/column-preferences',
    mapDeleteError: (error) => {
      if (error instanceof Error && error.message.includes('Posted')) {
        return { statusCode: 400, body: { error: error.message } };
      }
      return null;
    },
  });

  registerBulkRoutes(fastify, {
    path: '/fiscal-years',
    collection: ACCOUNTING_FISCAL_YEARS_COLLECTION,
    schema: fiscalYearListSchema,
    loadFn: loadFiscalYears,
    loadPageFn: loadFiscalYearsPage,
    saveFn: upsertFiscalYears,
    responseKey: 'fiscalYears',
    errorMessagePrefix: 'fiscal years',
  });

  registerMetricsRoute(fastify, {
    collection: ACCOUNTING_ENTRIES_COLLECTION,
    loadMetricsFn: async () => {
      const entries = await loadEntries();
      const accounts = await loadAccounts();
      return computeAccountingCommandMetrics(
        entries as Array<{
          status?: string;
          date?: string;
          lines?: Array<{ debit?: number; credit?: number; account_id?: string }>;
        }>,
        accounts as Array<{ id?: string; isActive?: boolean; type?: string }>,
      );
    },
    errorMessagePrefix: 'accounting',
  });
}
