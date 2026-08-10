import type { FastifyInstance } from 'fastify';
import type { User } from '@mms/shared';
import { DEFAULT_TEACHERS_SETTINGS } from '@mms/shared';
import { canReadCollection, canWriteCollection } from '../../../services/rbacService.js';
import {
  bulkUpdateTeacherStatus,
  computeNextTeacherEmployeeIdForSettings,
} from '../../../services/teacherService.js';
import {
  teachersBulkStatusSchema,
  teachersNextEmployeeIdQuerySchema,
} from '../../../validation/teacherSchemas.js';
import { parseRequest, replyValidationError } from '../../../lib/zodRequest.js';
import { sendDatabaseError, sendForbidden } from '../../../lib/httpErrors.js';
import { auditTeacher } from './teacherRouteHelpers.js';

/** Teachers domain operations (bulk status, next employee id) — not generic CRUD. */
export async function teacherOperationRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.post('/bulk-status', async (request, reply) => {
    const user = request.user as User;
    if (!canWriteCollection(user, 'teachers')) return sendForbidden(reply);
    const parsed = parseRequest(teachersBulkStatusSchema, request.body);
    if (!parsed.ok) return replyValidationError(reply, parsed.message);
    try {
      const result = await bulkUpdateTeacherStatus(parsed.data.ids.map(String), parsed.data.status);
      await auditTeacher(
        user,
        'teacher.bulk_status',
        `Updated status to ${parsed.data.status} for ${result.succeeded} teacher(s); ${result.failed} failed`,
      );
      return reply.send({ success: true, ...result });
    } catch {
      return sendDatabaseError(reply, 'Failed to bulk update teacher status');
    }
  });

  fastify.get('/next-employee-id', async (request, reply) => {
    const user = request.user as User;
    if (!canReadCollection(user, 'teachers')) return sendForbidden(reply);
    const parsed = parseRequest(teachersNextEmployeeIdQuerySchema, request.query);
    if (!parsed.ok) return replyValidationError(reply, parsed.message);
    const employeeId = await computeNextTeacherEmployeeIdForSettings({
      idPrefix: parsed.data.prefix ?? DEFAULT_TEACHERS_SETTINGS.idPrefix,
    });
    return reply.send({ employeeId });
  });
}
