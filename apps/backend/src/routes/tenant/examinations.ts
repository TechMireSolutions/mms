import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { authenticateTenant } from '../../middleware/authenticate.js';
import {
  EXAMINATIONS_MODULE_CONTRACT,
  examListSchema,
  examResultListSchema,
  computeExaminationsCommandMetrics,
} from '@mms/shared';
import { registerBulkRoutes, registerMetricsRoute } from '../../lib/crudRouter.js';
import {
  loadExams,
  replaceExams,
  loadExamResults,
  replaceExamResults,
} from '../../services/examinationService.js';

const EXAMS_COLLECTION = EXAMINATIONS_MODULE_CONTRACT.collectionKey;
const RESULTS_COLLECTION = EXAMINATIONS_MODULE_CONTRACT.resultsCollectionKey;

/**
 * Examinations module routes — metrics + column preferences until REST CRUD ships.
 */
export default async function examinationsRoutes(
  fastify: FastifyInstance,
  _options: FastifyPluginOptions,
): Promise<void> {
  fastify.addHook('preHandler', authenticateTenant);

  // --- Exams ---
  // --- Exams ---
  registerBulkRoutes(fastify, {
    path: '/exams',
    collection: EXAMS_COLLECTION,
    schema: examListSchema,
    loadFn: loadExams,
    saveFn: replaceExams,
    responseKey: 'exams',
    errorMessagePrefix: 'exams',
    columnPreferencesObjectKey: EXAMINATIONS_MODULE_CONTRACT.examColumnPreferencesObjectKey,
  });

  // --- Results ---
  registerBulkRoutes(fastify, {
    path: '/results',
    collection: RESULTS_COLLECTION,
    schema: examResultListSchema,
    loadFn: loadExamResults,
    saveFn: replaceExamResults,
    responseKey: 'results',
    errorMessagePrefix: 'exam results',
    columnPreferencesObjectKey: EXAMINATIONS_MODULE_CONTRACT.resultsColumnPreferencesObjectKey,
  });

  // --- Metrics ---
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
}
