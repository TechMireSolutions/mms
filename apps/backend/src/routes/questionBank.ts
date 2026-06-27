import { FastifyInstance, FastifyPluginOptions, FastifyRequest, FastifyReply } from 'fastify';
import { authenticateTenant } from '../middleware/authenticate.js';
import { canReadCollection, canWriteCollection } from '../services/rbacService.js';
import type { User } from '@mms/shared';
import { QUESTION_BANK_MODULE_CONTRACT } from '@mms/shared';
import { sendForbidden } from '../lib/httpErrors.js';
import { moduleColumnPreferencesBodySchema } from '../validation/moduleColumnPreferencesSchemas.js';
import { parseRequest, replyValidationError } from '../lib/zodRequest.js';
import {
  getUserColumnPreferencesForModule,
  setUserColumnPreferencesForModule,
} from '../services/userColumnPreferencesService.js';
import { loadQuestionBankCommandMetrics } from '../services/questionBankMetricsService.js';
import {
  loadQuestions,
  replaceQuestions,
  loadTests,
  replaceTests,
  loadResults,
  replaceResults,
} from '../services/questionBankService.js';
import {
  questionBankQuestionListSchema,
  questionBankTestListSchema,
  questionBankResultListSchema,
} from '../validation/questionBankSchemas.js';

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
  fastify.get('/questions', async (request, reply) => {
    const user = request.user as User;
    if (!canReadCollection(user, QUESTIONS_COLLECTION)) return sendForbidden(reply);
    try {
      return reply.send({ questions: await loadQuestions() });
    } catch {
      return reply.status(500).send({ type: 'database_error', message: 'Failed to load questions' });
    }
  });

  fastify.put('/questions/bulk', async (request, reply) => {
    const user = request.user as User;
    if (!canWriteCollection(user, QUESTIONS_COLLECTION)) return sendForbidden(reply);
    const parsed = parseRequest(questionBankQuestionListSchema, request.body);
    if (!parsed.ok) return replyValidationError(reply, parsed.message);
    try {
      const questions = await replaceQuestions(parsed.data);
      return reply.send({ questions });
    } catch {
      return reply.status(500).send({ type: 'database_error', message: 'Failed to update questions' });
    }
  });

  // --- Tests ---
  fastify.get('/tests', async (request, reply) => {
    const user = request.user as User;
    if (!canReadCollection(user, TESTS_COLLECTION)) return sendForbidden(reply);
    try {
      return reply.send({ tests: await loadTests() });
    } catch {
      return reply.status(500).send({ type: 'database_error', message: 'Failed to load tests' });
    }
  });

  fastify.put('/tests/bulk', async (request, reply) => {
    const user = request.user as User;
    if (!canWriteCollection(user, TESTS_COLLECTION)) return sendForbidden(reply);
    const parsed = parseRequest(questionBankTestListSchema, request.body);
    if (!parsed.ok) return replyValidationError(reply, parsed.message);
    try {
      const tests = await replaceTests(parsed.data);
      return reply.send({ tests });
    } catch {
      return reply.status(500).send({ type: 'database_error', message: 'Failed to update tests' });
    }
  });

  // --- Assessment Results ---
  fastify.get('/assessment-results', async (request, reply) => {
    const user = request.user as User;
    if (!canReadCollection(user, RESULTS_COLLECTION)) return sendForbidden(reply);
    try {
      return reply.send({ results: await loadResults() });
    } catch {
      return reply.status(500).send({ type: 'database_error', message: 'Failed to load assessment results' });
    }
  });

  fastify.put('/assessment-results/bulk', async (request, reply) => {
    const user = request.user as User;
    if (!canWriteCollection(user, RESULTS_COLLECTION)) return sendForbidden(reply);
    const parsed = parseRequest(questionBankResultListSchema, request.body);
    if (!parsed.ok) return replyValidationError(reply, parsed.message);
    try {
      const results = await replaceResults(parsed.data);
      return reply.send({ results });
    } catch {
      return reply.status(500).send({ type: 'database_error', message: 'Failed to update assessment results' });
    }
  });

  // --- Metrics ---
  fastify.get('/metrics', async (request, reply) => {
    const user = request.user as User;
    if (!canReadCollection(user, QUESTIONS_COLLECTION)) return sendForbidden(reply);
    try {
      return reply.send({ metrics: await loadQuestionBankCommandMetrics() });
    } catch {
      return reply.status(500).send({ type: 'database_error', message: 'Failed to load question bank metrics' });
    }
  });

  // --- Column Preferences (both formats) ---
  const getPrefs = async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user as User;
    if (!canReadCollection(user, QUESTIONS_COLLECTION)) return sendForbidden(reply);
    try {
      const preferences = await getUserColumnPreferencesForModule(
        QUESTION_BANK_MODULE_CONTRACT.columnPreferencesObjectKey,
        String(user.id),
      );
      return reply.send({ preferences });
    } catch {
      return reply.status(500).send({ type: 'database_error', message: 'Failed to load column preferences' });
    }
  };

  const putPrefs = async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user as User;
    if (!canReadCollection(user, QUESTIONS_COLLECTION)) return sendForbidden(reply);
    const parsed = parseRequest(moduleColumnPreferencesBodySchema, request.body);
    if (!parsed.ok) return replyValidationError(reply, parsed.message);
    try {
      await setUserColumnPreferencesForModule(
        QUESTION_BANK_MODULE_CONTRACT.columnPreferencesObjectKey,
        String(user.id),
        parsed.data.preferences,
      );
      return reply.send({ success: true, preferences: parsed.data.preferences });
    } catch {
      return reply.status(500).send({ type: 'database_error', message: 'Failed to save column preferences' });
    }
  };

  fastify.get('/column-preferences', getPrefs);
  fastify.get('/column-prefs', getPrefs);
  fastify.put('/column-preferences', putPrefs);
  fastify.put('/column-prefs', putPrefs);
}
