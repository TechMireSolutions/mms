import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { authenticateTenant } from '../../middleware/authenticate.js';
import { canDeleteCollection, canReadCollection, canWriteCollection } from '../../services/rbacService.js';
import {
  EXAMINATIONS_MODULE_MANIFEST,
  examListSchema,
  examResultListSchema,
  computeExaminationsCommandMetrics,
  type User,
} from '@mms/shared';
import { z } from 'zod';
import { registerBulkRoutes, registerMetricsRoute } from '../../lib/crudRouter.js';
import { registerColumnPreferencesRoutes } from '../../lib/columnPreferencesRouter.js';
import { parseRequest, replyValidationError } from '../../lib/zodRequest.js';
import { sendDatabaseError, sendForbidden, sendNotFound } from '../../lib/httpErrors.js';
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

const includeDeletedQuerySchema = z.object({
  includeDeleted: z.enum(['true', 'false']).optional(),
});

const bulkIdsSchema = z.object({
  ids: z.array(z.string().min(1)).min(1),
  deletionReason: z.string().optional(),
});

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

  fastify.get('/exams', async (request, reply) => {
    const user = request.user as User;
    if (!canReadCollection(user, EXAMS_COLLECTION)) return sendForbidden(reply);
    const parsed = parseRequest(includeDeletedQuerySchema, request.query);
    if (!parsed.ok) return replyValidationError(reply, parsed.message);
    const includeDeleted = parsed.data.includeDeleted === 'true';
    if (includeDeleted && !canDeleteCollection(user, EXAMS_COLLECTION)) {
      return sendForbidden(reply);
    }
    try {
      const exams = await loadExams({ includeDeleted });
      return reply.send({ exams });
    } catch {
      return sendDatabaseError(reply, 'Failed to load exams');
    }
  });

  fastify.put('/exams/bulk', async (request, reply) => {
    const user = request.user as User;
    if (!canWriteCollection(user, EXAMS_COLLECTION)) return sendForbidden(reply);
    const parsed = parseRequest(examListSchema, request.body);
    if (!parsed.ok) return replyValidationError(reply, parsed.message);
    try {
      const exams = await upsertExams(parsed.data);
      return reply.send({ exams });
    } catch {
      return sendDatabaseError(reply, 'Failed to update exams');
    }
  });

  fastify.delete<{ Params: { id: string } }>('/exams/:id', async (request, reply) => {
    const user = request.user as User;
    if (!canDeleteCollection(user, EXAMS_COLLECTION)) return sendForbidden(reply);
    try {
      const ok = await deleteExamById(request.params.id, String(user.id));
      if (!ok) return sendNotFound(reply, 'Exam not found');
      return reply.send({ success: true });
    } catch {
      return sendDatabaseError(reply, 'Failed to delete exam');
    }
  });

  fastify.post<{ Params: { id: string } }>('/exams/:id/restore', async (request, reply) => {
    const user = request.user as User;
    if (!canDeleteCollection(user, EXAMS_COLLECTION)) return sendForbidden(reply);
    try {
      const ok = await restoreExamById(request.params.id);
      if (!ok) return sendNotFound(reply, 'Exam not found');
      return reply.send({ success: true });
    } catch {
      return sendDatabaseError(reply, 'Failed to restore exam');
    }
  });

  fastify.post('/exams/bulk-delete', async (request, reply) => {
    const user = request.user as User;
    if (!canDeleteCollection(user, EXAMS_COLLECTION)) return sendForbidden(reply);
    const parsed = parseRequest(bulkIdsSchema, request.body);
    if (!parsed.ok) return replyValidationError(reply, parsed.message);
    try {
      const result = await bulkSoftDeleteExams(
        parsed.data.ids,
        String(user.id),
        parsed.data.deletionReason,
      );
      return reply.send({ success: true, ...result });
    } catch {
      return sendDatabaseError(reply, 'Failed to bulk delete exams');
    }
  });

  fastify.post('/exams/bulk-restore', async (request, reply) => {
    const user = request.user as User;
    if (!canDeleteCollection(user, EXAMS_COLLECTION)) return sendForbidden(reply);
    const parsed = parseRequest(bulkIdsSchema, request.body);
    if (!parsed.ok) return replyValidationError(reply, parsed.message);
    try {
      const result = await bulkRestoreExams(parsed.data.ids);
      return reply.send({ success: true, ...result });
    } catch {
      return sendDatabaseError(reply, 'Failed to bulk restore exams');
    }
  });

  registerColumnPreferencesRoutes(fastify, {
    path: '/exams/column-preferences',
    collection: EXAMS_COLLECTION,
    objectKey: EXAMINATIONS_MODULE_MANIFEST.examColumnPreferencesObjectKey,
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
