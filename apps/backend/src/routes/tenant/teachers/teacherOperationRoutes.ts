import type { FastifyInstance } from 'fastify';
import type { Teacher, User } from '@mms/shared';
import { DEFAULT_TEACHERS_SETTINGS } from '@mms/shared';
import { canReadCollection, canWriteCollection } from '../../../services/rbacService.js';
import { teacherUseCases } from '../../../teachers/use-cases/teacherUseCases.js';
import {
  teacherRecordSchema,
  teachersBulkStatusSchema,
  teachersNextEmployeeIdQuerySchema,
} from '../../../validation/teacherSchemas.js';
import {
  executeDynamicValidation,
  parseRequest,
  replyValidationError,
} from '../../../lib/zodRequest.js';
import { sendConflict, sendDatabaseError, sendForbidden } from '../../../lib/httpErrors.js';
import { validateTeacherDynamic } from '../../../services/teacherValidationService.js';
import {
  auditTeacher,
  sanitizeOneTeacherForUser,
} from './teacherRouteHelpers.js';

/** Teachers domain operations (create, bulk status, next employee id) — not generic CRUD. */
export async function teacherOperationRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.post(
    '/',
    {
      bodyLimit: 1048576,
      schema: { body: { type: 'object', additionalProperties: true } },
    },
    async (request, reply) => {
      const user = request.user as User;
      if (!canWriteCollection(user, 'teachers')) return sendForbidden(reply);
      const parsed = parseRequest(teacherRecordSchema, request.body);
      if (!parsed.ok) return replyValidationError(reply, parsed.message);

      const isValid = await executeDynamicValidation(request, reply, (tenant, lang) =>
        validateTeacherDynamic(tenant, parsed.data, lang),
      );
      if (!isValid) return;

      try {
        const { record, restored } = await teacherUseCases.createTeacher(parsed.data);
        const id = String(record.id);
        if (restored) {
          await auditTeacher(
            user,
            'teacher.restore',
            `Restored teacher ${id} via re-registration`,
            id,
          );
        } else {
          await auditTeacher(user, 'teacher.create', `Created teacher ${id}`, id);
        }
        return reply
          .status(restored ? 200 : 201)
          .send({ success: true, teacher: await sanitizeOneTeacherForUser(record as Teacher, user) });
      } catch (error: unknown) {
        const errMsg = error instanceof Error ? error.message : 'Failed to create teacher';
        const statusCode =
          typeof error === 'object' &&
          error !== null &&
          'statusCode' in error &&
          typeof (error as { statusCode: unknown }).statusCode === 'number'
            ? (error as { statusCode: number }).statusCode
            : 0;
        if (statusCode === 409) return sendConflict(reply, errMsg);
        return sendDatabaseError(reply, errMsg);
      }
    },
  );

  fastify.post('/bulk-status', async (request, reply) => {
    const user = request.user as User;
    if (!canWriteCollection(user, 'teachers')) return sendForbidden(reply);
    const parsed = parseRequest(teachersBulkStatusSchema, request.body);
    if (!parsed.ok) return replyValidationError(reply, parsed.message);
    try {
      const result = await teacherUseCases.bulkUpdateTeacherStatus(
        parsed.data.ids.map(String),
        parsed.data.status,
      );
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
    const employeeId = await teacherUseCases.computeNextTeacherEmployeeIdForSettings({
      idPrefix: parsed.data.prefix ?? DEFAULT_TEACHERS_SETTINGS.idPrefix,
    });
    return reply.send({ employeeId });
  });
}
