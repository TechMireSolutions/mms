import type { FastifyInstance, FastifyPluginOptions } from 'fastify';
import {
  FINANCE_MODULE_MANIFEST,
  normalizeFinanceReportComparisonQuery,
  type User,
} from '@mms/shared';
import { z } from 'zod';
import { canReadCollection } from '../../../services/rbacService.js';
import { loadFinanceReportAggregates } from '../../../services/financeService.js';
import { sendDatabaseError, sendForbidden } from '../../../lib/httpErrors.js';
import { parseRequest, replyValidationError } from '../../../lib/zodRequest.js';

const COLLECTION = FINANCE_MODULE_MANIFEST.collectionKey;

const financeReportAggregatesQuerySchema = z.object({
  sessionIds: z.string().max(200).optional(),
  rangeAFrom: z.string().max(32).optional(),
  rangeATo: z.string().max(32).optional(),
  rangeBFrom: z.string().max(32).optional(),
  rangeBTo: z.string().max(32).optional(),
});

/** Finance report SQL aggregates (ComparisonMode feeCollected + monthly collected). */
export async function financeReportRoutes(
  fastify: FastifyInstance,
  _options: FastifyPluginOptions,
): Promise<void> {
  fastify.get('/report-aggregates', async (request, reply) => {
    const user = request.user as User;
    if (!canReadCollection(user, COLLECTION)) return sendForbidden(reply);
    const parsed = parseRequest(financeReportAggregatesQuerySchema, request.query);
    if (!parsed.ok) return replyValidationError(reply, parsed.message);
    const comparisonQuery = normalizeFinanceReportComparisonQuery({
      sessionIds: parsed.data.sessionIds
        ? parsed.data.sessionIds.split(',').map((id) => id.trim()).filter(Boolean)
        : undefined,
      rangeAFrom: parsed.data.rangeAFrom,
      rangeATo: parsed.data.rangeATo,
      rangeBFrom: parsed.data.rangeBFrom,
      rangeBTo: parsed.data.rangeBTo,
    });
    try {
      const aggregates = await loadFinanceReportAggregates(comparisonQuery);
      return reply.send(aggregates);
    } catch {
      return sendDatabaseError(reply, 'Failed to load finance report aggregates');
    }
  });
}
