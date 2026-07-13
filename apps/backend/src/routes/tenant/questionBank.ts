import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { z } from 'zod';
import { authenticateTenant } from '../../middleware/authenticate.js';
import { QUESTION_BANK_MODULE_CONTRACT } from '@mms/shared';
import { registerColumnPreferencesRoutes } from '../../lib/columnPreferencesRouter.js';
import { registerBulkRoutes, registerMetricsRoute } from '../../lib/crudRouter.js';
import { sendForbidden } from '../../lib/httpErrors.js';
import { parseRequest, replyValidationError } from '../../lib/zodRequest.js';
import { canReadCollection } from '../../services/rbacService.js';

import { loadQuestionBankCommandMetrics } from '../../services/questionBankMetricsService.js';
import {
  loadQuestions,
  replaceQuestions,
  loadTests,
  replaceTests,
  loadResults,
  replaceResults,
  generateQuestionBankTestSelection,
} from '../../services/questionBankService.js';
import {
  questionBankQuestionListSchema,
  questionBankTestListSchema,
  questionBankResultListSchema,
  type User,
} from '@mms/shared';

const QUESTIONS_COLLECTION = QUESTION_BANK_MODULE_CONTRACT.collectionKey;
const TESTS_COLLECTION = QUESTION_BANK_MODULE_CONTRACT.testsCollectionKey;
const RESULTS_COLLECTION = QUESTION_BANK_MODULE_CONTRACT.resultsCollectionKey;

const generateTestBodySchema = z.object({
  categoryIds: z.array(z.string()).default([]),
  difficulty: z.enum(['easy', 'medium', 'hard', 'any']),
  numQuestions: z.number().int().min(1).max(100),
  shuffle: z.boolean().default(true),
});

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

  fastify.post('/tests/generate', async (request, reply) => {
    const user = request.user as User;
    if (!canReadCollection(user, QUESTIONS_COLLECTION)) return sendForbidden(reply);

    const parsed = parseRequest(generateTestBodySchema, request.body);
    if (!parsed.ok) return replyValidationError(reply, parsed.message);

    const selection = await generateQuestionBankTestSelection(parsed.data);
    return reply.send(selection);
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

  registerColumnPreferencesRoutes(fastify, {
    path: '/column-preferences',
    collection: QUESTIONS_COLLECTION,
    objectKey: QUESTION_BANK_MODULE_CONTRACT.columnPreferencesObjectKey,
  });
}
