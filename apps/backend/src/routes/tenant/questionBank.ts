import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { authenticateTenant } from '../../middleware/authenticate.js';
import {
  QUESTION_BANK_MODULE_MANIFEST,
  questionBankQuestionListSchema,
  questionBankTestListSchema,
  questionBankResultListSchema,
} from '@mms/shared';
import {
  registerBulkRoutes,
  registerMetricsRoute,
  registerSoftDeletableBulkRoutes,
} from '../../lib/crudRouter.js';
import { registerColumnPreferencesRoutes } from '../../lib/columnPreferencesRouter.js';

import { loadQuestionBankCommandMetrics } from '../../services/questionBankMetricsService.js';
import {
  loadQuestions,
  upsertQuestions,
  loadTests,
  upsertTests,
  loadResults,
  upsertResults,
  deleteQuestionById,
  restoreQuestionById,
  bulkSoftDeleteQuestions,
  bulkRestoreQuestions,
} from '../../services/questionBankService.js';

const QUESTIONS_COLLECTION = QUESTION_BANK_MODULE_MANIFEST.collectionKey;
const TESTS_COLLECTION = QUESTION_BANK_MODULE_MANIFEST.testsCollectionKey;
const RESULTS_COLLECTION = QUESTION_BANK_MODULE_MANIFEST.resultsCollectionKey;

/**
 * Question Bank module routes — upsert bulk + soft-delete questions; upsert tests/results.
 */
export default async function questionBankRoutes(
  fastify: FastifyInstance,
  _options: FastifyPluginOptions,
): Promise<void> {
  fastify.addHook('preHandler', authenticateTenant);

  registerMetricsRoute(fastify, {
    collection: QUESTIONS_COLLECTION,
    loadMetricsFn: loadQuestionBankCommandMetrics,
    errorMessagePrefix: 'question bank',
  });

  registerColumnPreferencesRoutes(fastify, {
    path: '/column-preferences',
    collection: QUESTIONS_COLLECTION,
    objectKey: QUESTION_BANK_MODULE_MANIFEST.columnPreferencesObjectKey,
  });

  registerSoftDeletableBulkRoutes(fastify, {
    path: '/questions',
    collection: QUESTIONS_COLLECTION,
    schema: questionBankQuestionListSchema,
    loadFn: loadQuestions,
    saveFn: upsertQuestions,
    deleteFn: deleteQuestionById,
    restoreFn: restoreQuestionById,
    bulkDeleteFn: bulkSoftDeleteQuestions,
    bulkRestoreFn: bulkRestoreQuestions,
    responseKey: 'questions',
    errorMessagePrefix: 'questions',
    nameSingular: 'Question',
  });

  registerBulkRoutes(fastify, {
    path: '/tests',
    collection: TESTS_COLLECTION,
    schema: questionBankTestListSchema,
    loadFn: loadTests,
    saveFn: upsertTests,
    responseKey: 'tests',
    errorMessagePrefix: 'tests',
  });

  registerBulkRoutes(fastify, {
    path: '/assessment-results',
    collection: RESULTS_COLLECTION,
    schema: questionBankResultListSchema,
    loadFn: loadResults,
    saveFn: upsertResults,
    responseKey: 'results',
    errorMessagePrefix: 'assessment results',
  });
}
