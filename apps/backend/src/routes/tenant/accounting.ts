import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { authenticateTenant } from '../../middleware/authenticate.js';
import {
  ACCOUNTING_MODULE_CONTRACT,
  accountListSchema,
  journalEntryListSchema,
  fiscalYearListSchema,
  computeAccountingCommandMetrics,
} from '@mms/shared';

import { registerBulkRoutes, registerMetricsRoute } from '../../lib/crudRouter.js';

import {
  loadAccounts,
  replaceAccounts,
  loadEntries,
  replaceEntries,
  loadFiscalYears,
  replaceFiscalYears,
} from '../../services/accountingService.js';

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
  registerBulkRoutes(fastify, {
    path: '/accounts',
    collection: ACCOUNTING_ACCOUNTS_COLLECTION,
    schema: accountListSchema,
    loadFn: loadAccounts,
    saveFn: replaceAccounts,
    responseKey: 'accounts',
    errorMessagePrefix: 'accounts',
    columnPreferencesObjectKey: ACCOUNTING_MODULE_CONTRACT.accountColumnPreferencesObjectKey,
  });

  // --- Entries ---
  registerBulkRoutes(fastify, {
    path: '/entries',
    collection: ACCOUNTING_ENTRIES_COLLECTION,
    schema: journalEntryListSchema,
    loadFn: loadEntries,
    saveFn: replaceEntries,
    responseKey: 'entries',
    errorMessagePrefix: 'entries',
    columnPreferencesObjectKey: ACCOUNTING_MODULE_CONTRACT.journalColumnPreferencesObjectKey,
    columnPreferencesPath: '/journal/column-preferences',
  });

  // --- Fiscal Years ---
  registerBulkRoutes(fastify, {
    path: '/fiscal-years',
    collection: ACCOUNTING_FISCAL_YEARS_COLLECTION,
    schema: fiscalYearListSchema,
    loadFn: loadFiscalYears,
    saveFn: replaceFiscalYears,
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
