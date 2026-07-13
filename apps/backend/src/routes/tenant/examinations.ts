import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { authenticateTenant } from '../../middleware/authenticate.js';
import {
  EXAMINATIONS_MODULE_CONTRACT,
  examListSchema,
  examResultListSchema,
  computeExaminationsCommandMetrics,
} from '@mms/shared';
import { registerColumnPreferencesRoutes } from '../../lib/columnPreferencesRouter.js';
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
  registerBulkRoutes(fastify, {
    path: '/exams',
    collection: EXAMS_COLLECTION,
    schema: examListSchema,
    loadFn: loadExams,
    saveFn: replaceExams,
    responseKey: 'exams',
    errorMessagePrefix: 'exams',
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

  registerColumnPreferencesRoutes(fastify, {
    path: '/exams/column-preferences',
    collection: EXAMS_COLLECTION,
    objectKey: EXAMINATIONS_MODULE_CONTRACT.examColumnPreferencesObjectKey,
  });

  registerColumnPreferencesRoutes(fastify, {
    path: '/results/column-preferences',
    collection: EXAMINATIONS_MODULE_CONTRACT.resultsCollectionKey,
    objectKey: EXAMINATIONS_MODULE_CONTRACT.resultsColumnPreferencesObjectKey,
  });
}
