import type { FastifyInstance, FastifyPluginOptions } from 'fastify';
import {
  ATTENDANCE_MODULE_MANIFEST,
  normalizeAttendanceReportComparisonQuery,
  parseComparisonQueryParams,
  reportComparisonQuerySchema,
  type User,
} from '@mms/shared';
import { canReadCollection } from '../../../services/rbacService.js';
import { loadAttendanceReportAggregates } from '../../../services/attendanceService.js';
import { sendDatabaseError, sendForbidden } from '../../../lib/httpErrors.js';
import { parseRequest, replyValidationError } from '../../../lib/zodRequest.js';

const COLLECTION = ATTENDANCE_MODULE_MANIFEST.collectionKey;

/** Attendance report SQL aggregates (ComparisonMode attendancePct + monthly present/total). */
export async function attendanceReportRoutes(
  fastify: FastifyInstance,
  _options: FastifyPluginOptions,
): Promise<void> {
  fastify.get('/report-aggregates', async (request, reply) => {
    const user = request.user as User;
    if (!canReadCollection(user, COLLECTION)) return sendForbidden(reply);
    const parsed = parseRequest(reportComparisonQuerySchema, request.query);
    if (!parsed.ok) return replyValidationError(reply, parsed.message);
    const comparisonQuery = normalizeAttendanceReportComparisonQuery(parseComparisonQueryParams(parsed.data));
    try {
      const aggregates = await loadAttendanceReportAggregates(comparisonQuery);
      return reply.send(aggregates);
    } catch {
      return sendDatabaseError(reply, 'Failed to load attendance report aggregates');
    }
  });
}
