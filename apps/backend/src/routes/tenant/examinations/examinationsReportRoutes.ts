import type { FastifyInstance, FastifyPluginOptions } from 'fastify';
import {
  EXAMINATIONS_MODULE_MANIFEST,
  normalizeExaminationsReportComparisonQuery,
  type User,
} from '@mms/shared';
import { z } from 'zod';
import { canReadCollection } from '../../../services/rbacService.js';
import { loadExaminationsReportAggregates } from '../../../services/examinationService.js';
import { sendDatabaseError, sendForbidden } from '../../../lib/httpErrors.js';
import { parseRequest, replyValidationError } from '../../../lib/zodRequest.js';

const COLLECTION = EXAMINATIONS_MODULE_MANIFEST.collectionKey;

const examinationsReportAggregatesQuerySchema = z.object({
  sessionIds: z.string().max(200).optional(),
  rangeAFrom: z.string().max(32).optional(),
  rangeATo: z.string().max(32).optional(),
  rangeBFrom: z.string().max(32).optional(),
  rangeBTo: z.string().max(32).optional(),
});

/** Examinations report SQL aggregates (ComparisonMode). */
export async function examinationsReportRoutes(
  fastify: FastifyInstance,
  _options: FastifyPluginOptions,
): Promise<void> {
  fastify.get('/report-aggregates', async (request, reply) => {
    const user = request.user as User;
    if (!canReadCollection(user, COLLECTION)) return sendForbidden(reply);
    const parsed = parseRequest(examinationsReportAggregatesQuerySchema, request.query);
    if (!parsed.ok) return replyValidationError(reply, parsed.message);
    const comparisonQuery = normalizeExaminationsReportComparisonQuery({
      sessionIds: parsed.data.sessionIds
        ? parsed.data.sessionIds.split(',').map((id) => id.trim()).filter(Boolean)
        : undefined,
      rangeAFrom: parsed.data.rangeAFrom,
      rangeATo: parsed.data.rangeATo,
      rangeBFrom: parsed.data.rangeBFrom,
      rangeBTo: parsed.data.rangeBTo,
    });
    try {
      const aggregates = await loadExaminationsReportAggregates(comparisonQuery);
      return reply.send(aggregates);
    } catch (e) {
      request.log.error(e, 'Failed to load examinations report aggregates');
      return sendDatabaseError(reply, 'Failed to load examinations report aggregates');
    }
  });
}
