import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { authenticateTenant } from '../../middleware/authenticate.js';
import {
  EXAMINATIONS_MODULE_MANIFEST,
  examListSchema,
  examResultListSchema,
  computeExaminationsCommandMetrics,
} from '@mms/shared';
import {
  registerBulkRoutes,
  registerMetricsRoute,
  registerSoftDeletableBulkRoutes,
} from '../../lib/crudRouter.js';
import {
  loadExams,
  upsertExams,
  loadExamResults,
  upsertExamResults,
  deleteExamById,
  restoreExamById,
  bulkSoftDeleteExams,
  bulkRestoreExams,
} from '../../services/examinationService.js';

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

  registerMetricsRoute(fastify, {
    collection: EXAMS_COLLECTION,
    loadMetricsFn: async () => {
      const exams = await loadExams();
      const results = await loadExamResults();
      return computeExaminationsCommandMetrics(
        exams as Array<{ status?: string }>,
        results as Array<{ examId?: string }>,
      );
    },
    errorMessagePrefix: 'examination',
  });

  registerSoftDeletableBulkRoutes(fastify, {
    path: '/exams',
    collection: EXAMS_COLLECTION,
    schema: examListSchema,
    loadFn: loadExams,
    saveFn: upsertExams,
    deleteFn: deleteExamById,
    restoreFn: restoreExamById,
    bulkDeleteFn: bulkSoftDeleteExams,
    bulkRestoreFn: bulkRestoreExams,
    responseKey: 'exams',
    errorMessagePrefix: 'exams',
    nameSingular: 'Exam',
    columnPreferencesObjectKey: EXAMINATIONS_MODULE_MANIFEST.examColumnPreferencesObjectKey,
  });

  registerBulkRoutes(fastify, {
    path: '/results',
    collection: RESULTS_COLLECTION,
    schema: examResultListSchema,
    loadFn: loadExamResults,
    saveFn: upsertExamResults,
    responseKey: 'results',
    errorMessagePrefix: 'exam results',
    columnPreferencesObjectKey: EXAMINATIONS_MODULE_MANIFEST.resultsColumnPreferencesObjectKey,
  });
}
