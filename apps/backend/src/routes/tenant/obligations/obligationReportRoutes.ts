import type { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { OBLIGATIONS_MODULE_MANIFEST, type User } from '@mms/shared';
import { z } from 'zod';
import { canReadCollection } from '../../../services/rbacService.js';
import { loadObligationsReportAggregates } from '../../../services/obligationService.js';
import { sendDatabaseError, sendForbidden } from '../../../lib/httpErrors.js';
import { parseRequest, replyValidationError } from '../../../lib/zodRequest.js';

const COLLECTION = OBLIGATIONS_MODULE_MANIFEST.collectionKey;

const obligationsReportQuerySchema = z.object({
  dateFrom: z.string().max(32).optional(),
  dateTo: z.string().max(32).optional(),
  typeId: z.string().max(64).optional(),
  repId: z.string().max(64).optional(),
});

/** Obligations report SQL aggregates. */
export async function obligationReportRoutes(
  fastify: FastifyInstance,
  _options: FastifyPluginOptions,
): Promise<void> {
  fastify.get('/report-aggregates', async (request, reply) => {
    const user = request.user as User;
    if (!canReadCollection(user, COLLECTION)) return sendForbidden(reply);
    const parsed = parseRequest(obligationsReportQuerySchema, request.query);
    if (!parsed.ok) return replyValidationError(reply, parsed.message);
    try {
      const aggregates = await loadObligationsReportAggregates({
        dateFrom: parsed.data.dateFrom?.trim() || undefined,
        dateTo: parsed.data.dateTo?.trim() || undefined,
        typeId: parsed.data.typeId?.trim() || undefined,
        repId: parsed.data.repId?.trim() || undefined,
      });
      return reply.send(aggregates);
    } catch {
      return sendDatabaseError(reply, 'Failed to load obligations report aggregates');
    }
  });
}
