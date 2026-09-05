import { type FastifyInstance, type FastifyPluginOptions } from 'fastify';
import { authenticateTenant } from '../../middleware/authenticate.js';
import { requireTenantModule } from '../../middleware/requireTenantModule.js';
import {
  ACCOUNTING_MODULE_MANIFEST,
  accountListSchema,
  journalEntryListSchema,
  fiscalYearListSchema,
} from '@mms/shared';
import {
  registerBulkRoutes,
  registerIncludableBulkRoutes,
  registerMetricsRoute,
  registerSoftDeletableBulkRoutes,
} from '../../lib/crudRouter.js';

import { accountingUseCases } from '../../accounting/use-cases/accountingUseCases.js';
import { accountingSetupConfigRoutes } from './accountingSetupConfigRoutes.js';
import { accountingContractRouter } from './accounting/accountingContractRouter.js';
import { accountingReportRoutes } from './accounting/accountingReportRoutes.js';
import { accountingLedgerOpsRoutes } from './accounting/accountingLedgerOpsRoutes.js';

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

  await fastify.register(
    async (sub) => {
      await sub.register(accountingSetupConfigRoutes);

      registerIncludableBulkRoutes(sub, {
        path: '/accounts',
        collection: ACCOUNTING_ACCOUNTS_COLLECTION,
        schema: accountListSchema,
        saveFn: accountingUseCases.upsertAccounts,
        responseKey: 'accounts',
        errorMessagePrefix: 'accounts',

        customGetRoute: true,
      });

      registerSoftDeletableBulkRoutes(sub, {
        path: '/entries',
        collection: ACCOUNTING_ENTRIES_COLLECTION,
        schema: journalEntryListSchema,
        loadFn: accountingUseCases.loadEntries,
        saveFn: accountingUseCases.upsertEntries,
        deleteFn: accountingUseCases.deleteJournalEntryById,
        restoreFn: accountingUseCases.restoreJournalEntryById,
        bulkDeleteFn: accountingUseCases.bulkSoftDeleteJournalEntries,
        bulkRestoreFn: accountingUseCases.bulkRestoreJournalEntries,
        responseKey: 'entries',
        errorMessagePrefix: 'entries',
        nameSingular: 'Journal entry',


        customGetRoute: true,
        mapDeleteError: (error) => {
          if (error instanceof Error && error.message.includes('Posted')) {
            return { statusCode: 400, body: { error: error.message } };
          }
          return null;
        },
      });

      registerBulkRoutes(sub, {
        path: '/fiscal-years',
        collection: ACCOUNTING_FISCAL_YEARS_COLLECTION,
        schema: fiscalYearListSchema,
        saveFn: accountingUseCases.upsertFiscalYears,
        responseKey: 'fiscalYears',
        errorMessagePrefix: 'fiscal years',
        customGetRoute: true,
      });

      registerMetricsRoute(sub, {
        collection: ACCOUNTING_ENTRIES_COLLECTION,
        loadMetricsFn: accountingUseCases.loadAccountingCommandMetrics,
        errorMessagePrefix: 'accounting',
      });

      await sub.register(accountingReportRoutes);
      await sub.register(accountingLedgerOpsRoutes);
    },
    { prefix: '/api/accounting' },
  );

  await fastify.register(accountingContractRouter);
}
