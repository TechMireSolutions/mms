import type { FastifyInstance, FastifyPluginOptions } from 'fastify';
import {
  HASANAT_MODULE_MANIFEST,
  normalizeHasanatReportComparisonQuery,
  type User,
} from '@mms/shared';
import { z } from 'zod';
import { canReadCollection } from '../../../services/rbacService.js';
import { loadHasanatReportAggregates } from '../../../services/hasanatService.js';
import { sendDatabaseError, sendForbidden } from '../../../lib/httpErrors.js';
import { parseRequest, replyValidationError } from '../../../lib/zodRequest.js';

const COLLECTION = HASANAT_MODULE_MANIFEST.collectionKey;

const hasanatReportAggregatesQuerySchema = z.object({
  sessionIds: z.string().max(200).optional(),
  rangeAFrom: z.string().max(32).optional(),
  rangeATo: z.string().max(32).optional(),
  rangeBFrom: z.string().max(32).optional(),
  rangeBTo: z.string().max(32).optional(),
});

/** Hasanat report SQL aggregates (ComparisonMode session points + monthly points). */
export async function hasanatReportRoutes(
  fastify: FastifyInstance,
  _options: FastifyPluginOptions,
): Promise<void> {
  fastify.get('/report-aggregates', async (request, reply) => {
    const user = request.user as User;
    if (!canReadCollection(user, COLLECTION)) return sendForbidden(reply);
    const parsed = parseRequest(hasanatReportAggregatesQuerySchema, request.query);
    if (!parsed.ok) return replyValidationError(reply, parsed.message);
    const comparisonQuery = normalizeHasanatReportComparisonQuery({
      sessionIds: parsed.data.sessionIds
        ? parsed.data.sessionIds.split(',').map((id) => id.trim()).filter(Boolean)
        : undefined,
      rangeAFrom: parsed.data.rangeAFrom,
      rangeATo: parsed.data.rangeATo,
      rangeBFrom: parsed.data.rangeBFrom,
      rangeBTo: parsed.data.rangeBTo,
    });
    try {
      const aggregates = await loadHasanatReportAggregates(comparisonQuery);
      return reply.send(aggregates);
    } catch {
      return sendDatabaseError(reply, 'Failed to load hasanat report aggregates');
    }
  });
}
