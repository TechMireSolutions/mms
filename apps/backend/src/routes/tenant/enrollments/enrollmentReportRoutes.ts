import type { FastifyInstance, FastifyPluginOptions } from 'fastify';
import {
  ENROLLMENTS_MODULE_MANIFEST,
  normalizeEnrollmentsReportComparisonQuery,
  type User,
} from '@mms/shared';
import { z } from 'zod';
import { canReadCollection } from '../../../services/rbacService.js';
import { loadEnrollmentsReportAggregates } from '../../../services/enrollmentService.js';
import { sendDatabaseError, sendForbidden } from '../../../lib/httpErrors.js';
import { parseRequest, replyValidationError } from '../../../lib/zodRequest.js';

const COLLECTION = ENROLLMENTS_MODULE_MANIFEST.collectionKey;

const enrollmentsReportAggregatesQuerySchema = z.object({
  sessionIds: z.string().max(200).optional(),
  rangeAFrom: z.string().max(32).optional(),
  rangeATo: z.string().max(32).optional(),
  rangeBFrom: z.string().max(32).optional(),
  rangeBTo: z.string().max(32).optional(),
});

/** Enrollments report SQL aggregates (EnrollmentChart + EnrollmentReports + ComparisonMode). */
export async function enrollmentReportRoutes(
  fastify: FastifyInstance,
  _options: FastifyPluginOptions,
): Promise<void> {
  fastify.get('/report-aggregates', async (request, reply) => {
    const user = request.user as User;
    if (!canReadCollection(user, COLLECTION)) return sendForbidden(reply);
    const parsed = parseRequest(enrollmentsReportAggregatesQuerySchema, request.query);
    if (!parsed.ok) return replyValidationError(reply, parsed.message);
    const comparisonQuery = normalizeEnrollmentsReportComparisonQuery({
      sessionIds: parsed.data.sessionIds
        ? parsed.data.sessionIds.split(',').map((id) => id.trim()).filter(Boolean)
        : undefined,
      rangeAFrom: parsed.data.rangeAFrom,
      rangeATo: parsed.data.rangeATo,
      rangeBFrom: parsed.data.rangeBFrom,
      rangeBTo: parsed.data.rangeBTo,
    });
    try {
      const aggregates = await loadEnrollmentsReportAggregates(comparisonQuery);
      return reply.send(aggregates);
    } catch {
      return sendDatabaseError(reply, 'Failed to load enrollments report aggregates');
    }
  });
}
