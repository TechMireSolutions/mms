import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { authenticateTenant } from '../../middleware/authenticate.js';
import { QUESTION_BANK_MODULE_CONTRACT } from '@mms/shared';
import { registerBulkRoutes, registerMetricsRoute } from '../../lib/crudRouter.js';

import { loadQuestionBankCommandMetrics } from '../../services/questionBankMetricsService.js';
import {
  loadQuestions,
  replaceQuestions,
  loadTests,
  replaceTests,
  loadResults,
  replaceResults,
} from '../../services/questionBankService.js';
import {
  questionBankQuestionListSchema,
  questionBankTestListSchema,
  questionBankResultListSchema,
} from '@mms/shared';

const QUESTIONS_COLLECTION = QUESTION_BANK_MODULE_CONTRACT.collectionKey;
const TESTS_COLLECTION = QUESTION_BANK_MODULE_CONTRACT.testsCollectionKey;
const RESULTS_COLLECTION = QUESTION_BANK_MODULE_CONTRACT.resultsCollectionKey;

/**
 * Question Bank module routes — metrics, column preferences, and REST bulk CRUD endpoints.
 */
export default async function questionBankRoutes(
  fastify: FastifyInstance,
  _options: FastifyPluginOptions,
): Promise<void> {
  fastify.addHook('preHandler', authenticateTenant);

  // --- Questions ---
  registerBulkRoutes(fastify, {
    path: '/questions',
    collection: QUESTIONS_COLLECTION,
    schema: questionBankQuestionListSchema,
    loadFn: loadQuestions,
    saveFn: replaceQuestions,
    responseKey: 'questions',
    errorMessagePrefix: 'questions',
    columnPreferencesObjectKey: QUESTION_BANK_MODULE_CONTRACT.columnPreferencesObjectKey,
    columnPreferencesPath: '/column-preferences',
  });

  // --- Tests ---
  registerBulkRoutes(fastify, {
    path: '/tests',
    collection: TESTS_COLLECTION,
    schema: questionBankTestListSchema,
    loadFn: loadTests,
    saveFn: replaceTests,
    responseKey: 'tests',
    errorMessagePrefix: 'tests',
  });

  // --- Assessment Results ---
  registerBulkRoutes(fastify, {
    path: '/assessment-results',
    collection: RESULTS_COLLECTION,
    schema: questionBankResultListSchema,
    loadFn: loadResults,
    saveFn: replaceResults,
    responseKey: 'results',
    errorMessagePrefix: 'assessment results',
  });

  // --- Metrics ---
  registerMetricsRoute(fastify, {
    collection: QUESTIONS_COLLECTION,
    loadMetricsFn: loadQuestionBankCommandMetrics,
    errorMessagePrefix: 'question bank',
  });
}
