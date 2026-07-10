import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { authenticateTenant } from '../../middleware/authenticate.js';
import { canReadCollection, canWriteCollection } from '../../services/rbacService.js';
import type { User } from '@mms/shared';
import { EXAMINATIONS_MODULE_CONTRACT } from '@mms/shared';
import { sendForbidden } from '../../lib/httpErrors.js';
import { registerColumnPreferencesRoutes } from '../../lib/columnPreferencesRouter.js';
import { parseRequest, replyValidationError } from '../../lib/zodRequest.js';

import { loadExaminationsCommandMetrics } from '../../services/examinationsMetricsService.js';
import {
  loadExams,
  replaceExams,
  loadExamResults,
  replaceExamResults,
} from '../../services/examinationService.js';
import {
  examListSchema,
  examResultListSchema,
} from '../../validation/examinationSchemas.js';

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
  fastify.get('/exams', async (request, reply) => {
    const user = request.user as User;
    if (!canReadCollection(user, EXAMS_COLLECTION)) return sendForbidden(reply);
    try {
      return reply.send({ exams: await loadExams() });
    } catch {
      return reply.status(500).send({ type: 'database_error', message: 'Failed to load exams' });
    }
  });

  fastify.put('/exams/bulk', async (request, reply) => {
    const user = request.user as User;
    if (!canWriteCollection(user, EXAMS_COLLECTION)) return sendForbidden(reply);
    const parsed = parseRequest(examListSchema, request.body);
    if (!parsed.ok) return replyValidationError(reply, parsed.message);
    try {
      const exams = await replaceExams(parsed.data);
      return reply.send({ exams });
    } catch {
      return reply.status(500).send({ type: 'database_error', message: 'Failed to update exams' });
    }
  });

  // --- Results ---
  fastify.get('/results', async (request, reply) => {
    const user = request.user as User;
    if (!canReadCollection(user, RESULTS_COLLECTION)) return sendForbidden(reply);
    try {
      return reply.send({ results: await loadExamResults() });
    } catch {
      return reply.status(500).send({ type: 'database_error', message: 'Failed to load exam results' });
    }
  });

  fastify.put('/results/bulk', async (request, reply) => {
    const user = request.user as User;
    if (!canWriteCollection(user, RESULTS_COLLECTION)) return sendForbidden(reply);
    const parsed = parseRequest(examResultListSchema, request.body);
    if (!parsed.ok) return replyValidationError(reply, parsed.message);
    try {
      const results = await replaceExamResults(parsed.data);
      return reply.send({ results });
    } catch {
      return reply.status(500).send({ type: 'database_error', message: 'Failed to update exam results' });
    }
  });

  // --- Metrics ---
  fastify.get('/metrics', async (request, reply) => {
    const user = request.user as User;
    if (!canReadCollection(user, EXAMS_COLLECTION)) return sendForbidden(reply);
    try {
      return reply.send({ metrics: await loadExaminationsCommandMetrics() });
    } catch {
      return reply.status(500).send({ type: 'database_error', message: 'Failed to load examination metrics' });
    }
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
