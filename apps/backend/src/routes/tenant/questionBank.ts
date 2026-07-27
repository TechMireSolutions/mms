import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { authenticateTenant } from '../../middleware/authenticate.js';
import { canDeleteCollection, canReadCollection, canWriteCollection } from '../../services/rbacService.js';
import { QUESTION_BANK_MODULE_MANIFEST, type User } from '@mms/shared';
import { z } from 'zod';
import { registerBulkRoutes, registerMetricsRoute } from '../../lib/crudRouter.js';
import { registerColumnPreferencesRoutes } from '../../lib/columnPreferencesRouter.js';
import { parseRequest, replyValidationError } from '../../lib/zodRequest.js';
import { sendDatabaseError, sendForbidden, sendNotFound } from '../../lib/httpErrors.js';

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
import {
  questionBankQuestionListSchema,
  questionBankTestListSchema,
  questionBankResultListSchema,
} from '@mms/shared';

const QUESTIONS_COLLECTION = QUESTION_BANK_MODULE_MANIFEST.collectionKey;
const TESTS_COLLECTION = QUESTION_BANK_MODULE_MANIFEST.testsCollectionKey;
const RESULTS_COLLECTION = QUESTION_BANK_MODULE_MANIFEST.resultsCollectionKey;

const includeDeletedQuerySchema = z.object({
  includeDeleted: z.enum(['true', 'false']).optional(),
});

const bulkIdsSchema = z.object({
  ids: z.array(z.string().min(1)).min(1),
  deletionReason: z.string().optional(),
});

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

  // --- Questions (soft-delete + upsert) ---
  fastify.get('/questions', async (request, reply) => {
    const user = request.user as User;
    if (!canReadCollection(user, QUESTIONS_COLLECTION)) return sendForbidden(reply);
    const parsed = parseRequest(includeDeletedQuerySchema, request.query);
    if (!parsed.ok) return replyValidationError(reply, parsed.message);
    const includeDeleted = parsed.data.includeDeleted === 'true';
    if (includeDeleted && !canDeleteCollection(user, QUESTIONS_COLLECTION)) {
      return sendForbidden(reply);
    }
    try {
      const questions = await loadQuestions({ includeDeleted });
      return reply.send({ questions });
    } catch {
      return sendDatabaseError(reply, 'Failed to load questions');
    }
  });

  fastify.put('/questions/bulk', async (request, reply) => {
    const user = request.user as User;
    if (!canWriteCollection(user, QUESTIONS_COLLECTION)) return sendForbidden(reply);
    const parsed = parseRequest(questionBankQuestionListSchema, request.body);
    if (!parsed.ok) return replyValidationError(reply, parsed.message);
    try {
      const questions = await upsertQuestions(parsed.data);
      return reply.send({ questions });
    } catch {
      return sendDatabaseError(reply, 'Failed to update questions');
    }
  });

  fastify.delete<{ Params: { id: string } }>('/questions/:id', async (request, reply) => {
    const user = request.user as User;
    if (!canDeleteCollection(user, QUESTIONS_COLLECTION)) return sendForbidden(reply);
    try {
      const ok = await deleteQuestionById(request.params.id, String(user.id));
      if (!ok) return sendNotFound(reply, 'Question not found');
      return reply.send({ success: true });
    } catch {
      return sendDatabaseError(reply, 'Failed to delete question');
    }
  });

  fastify.post<{ Params: { id: string } }>('/questions/:id/restore', async (request, reply) => {
    const user = request.user as User;
    if (!canDeleteCollection(user, QUESTIONS_COLLECTION)) return sendForbidden(reply);
    try {
      const ok = await restoreQuestionById(request.params.id);
      if (!ok) return sendNotFound(reply, 'Question not found');
      return reply.send({ success: true });
    } catch {
      return sendDatabaseError(reply, 'Failed to restore question');
    }
  });

  fastify.post('/questions/bulk-delete', async (request, reply) => {
    const user = request.user as User;
    if (!canDeleteCollection(user, QUESTIONS_COLLECTION)) return sendForbidden(reply);
    const parsed = parseRequest(bulkIdsSchema, request.body);
    if (!parsed.ok) return replyValidationError(reply, parsed.message);
    try {
      const result = await bulkSoftDeleteQuestions(
        parsed.data.ids,
        String(user.id),
        parsed.data.deletionReason,
      );
      return reply.send({ success: true, ...result });
    } catch {
      return sendDatabaseError(reply, 'Failed to bulk delete questions');
    }
  });

  fastify.post('/questions/bulk-restore', async (request, reply) => {
    const user = request.user as User;
    if (!canDeleteCollection(user, QUESTIONS_COLLECTION)) return sendForbidden(reply);
    const parsed = parseRequest(bulkIdsSchema, request.body);
    if (!parsed.ok) return replyValidationError(reply, parsed.message);
    try {
      const result = await bulkRestoreQuestions(parsed.data.ids);
      return reply.send({ success: true, ...result });
    } catch {
      return sendDatabaseError(reply, 'Failed to bulk restore questions');
    }
  });

  // --- Tests (upsert only) ---
  registerBulkRoutes(fastify, {
    path: '/tests',
    collection: TESTS_COLLECTION,
    schema: questionBankTestListSchema,
    loadFn: loadTests,
    saveFn: upsertTests,
    responseKey: 'tests',
    errorMessagePrefix: 'tests',
  });

  // --- Assessment Results (upsert only) ---
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
