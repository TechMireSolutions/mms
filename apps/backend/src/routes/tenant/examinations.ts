import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { authenticateTenant } from '../../middleware/authenticate.js';
import { requireTenantModule } from '../../middleware/requireTenantModule.js';
import {
  EXAMINATIONS_MODULE_MANIFEST,
  examListSchema,
  examResultListSchema,
} from '@mms/shared';
import {
  registerBulkRoutes,
  registerMetricsRoute,
  registerSoftDeletableBulkRoutes,
} from '../../lib/crudRouter.js';
import {
  loadExams,
  upsertExams,
  upsertExamResults,
  deleteExamById,
  restoreExamById,
  bulkSoftDeleteExams,
  bulkRestoreExams,
  loadExaminationsCommandMetrics,
} from '../../services/examinationService.js';

import { examinationSetupConfigRoutes } from './examinationSetupConfigRoutes.js';
import { examinationsReportRoutes } from './examinations/examinationsReportRoutes.js';
import { examinationContractRouter } from './examinations/examinationContractRouter.js';

const EXAMS_COLLECTION = EXAMINATIONS_MODULE_MANIFEST.collectionKey;
const RESULTS_COLLECTION = EXAMINATIONS_MODULE_MANIFEST.resultsCollectionKey;

/**
 * Examinations module routes — upsert bulk + soft-delete exams.
 */
export default async function examinationsRoutes(
  fastify: FastifyInstance,
  _options: FastifyPluginOptions,
): Promise<void> {
  fastify.addHook('preHandler', authenticateTenant);
  fastify.addHook('preHandler', requireTenantModule('examination'));

  await fastify.register(
    async (sub) => {
      await sub.register(examinationSetupConfigRoutes);
      await sub.register(examinationsReportRoutes);

      registerMetricsRoute(sub, {
        collection: EXAMS_COLLECTION,
        loadMetricsFn: loadExaminationsCommandMetrics,
        errorMessagePrefix: 'examination',
      });

      registerSoftDeletableBulkRoutes(sub, {
        path: '/exams',
        collection: EXAMS_COLLECTION,
        schema: examListSchema,
        loadFn: loadExams,
        saveFn: upsertExams as any,
        deleteFn: deleteExamById,
        restoreFn: restoreExamById,
        bulkDeleteFn: bulkSoftDeleteExams,
        bulkRestoreFn: bulkRestoreExams,
        responseKey: 'exams',
        errorMessagePrefix: 'exams',
        nameSingular: 'Exam',

        customGetRoute: true,
        customBulkTrashRoutes: true,
      });

      registerBulkRoutes(sub, {
        path: '/results',
        collection: RESULTS_COLLECTION,
        schema: examResultListSchema,
        saveFn: upsertExamResults,
        responseKey: 'results',
        errorMessagePrefix: 'exam results',

        customGetRoute: true,
      });
    },
    { prefix: '/api/examinations' },
  );

  await fastify.register(examinationContractRouter);
}
