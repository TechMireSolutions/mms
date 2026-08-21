import type { FastifyInstance } from 'fastify';
import type { Student, User } from '@mms/shared';
import {
  STUDENTS_MODULE_MANIFEST,
  roleHasPermission,
} from '@mms/shared';
import { canReadCollection, canWriteCollection } from '../../../services/rbacService.js';
import { studentUseCases } from '../../../students/use-cases/studentUseCases.js';
import { StudentRestoreConflictError, StudentPermissionError } from '../../../students/use-cases/studentNormalizeUseCases.js';
import { validateStudentDynamic } from '../../../services/studentValidationService.js';
import {
  studentsBulkEnrollBodySchema,
  studentsBulkStatusSchema,
  studentsDuplicateCheckBodySchema,
  studentsNextGrNumberQuerySchema,
} from '../../../validation/studentSchemas.js';
import {
  executeDynamicValidation,
  parseRequest,
  replyValidationError,
} from '../../../lib/zodRequest.js';
import { sendConflict, sendDatabaseError, sendForbidden } from '../../../lib/httpErrors.js';
import { auditStudent, parseStudentWriteBody, sanitizeOneStudentForUser } from './studentRouteHelpers.js';

/** Students domain operations (GR, bulk status, duplicate check) — not generic CRUD. */
export async function studentOperationRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.post(
    '/',
    {
      bodyLimit: 1048576,
      schema: { body: { type: 'object', additionalProperties: true } },
    },
    async (request, reply) => {
      const user = request.user as User;
      if (!canWriteCollection(user, 'students')) return sendForbidden(reply);
      const parsed = await parseStudentWriteBody(request.body);
      if (!parsed.ok) return replyValidationError(reply, parsed.message);

      const isValid = await executeDynamicValidation(request, reply, (tenant, lang) =>
        validateStudentDynamic(tenant, parsed.data, lang),
      );
      if (!isValid) return;

      try {
        const { record, restored } = await studentUseCases.createStudent(
          parsed.data as never,
          { user },
        );
        const id = String(record.id);
        if (restored) {
          await auditStudent(
            user,
            'student.restore',
            `Restored student ${id} via re-registration`,
            id,
          );
        } else {
          await auditStudent(user, 'student.create', `Created student ${id}`, id);
        }
        return reply
          .status(restored ? 200 : 201)
          .send({ success: true, student: await sanitizeOneStudentForUser(record as Student, user) });
      } catch (error: unknown) {
        if (error instanceof StudentPermissionError) {
          return sendForbidden(reply, error.message);
        }
        if (error instanceof StudentRestoreConflictError) {
          return reply.status(400).send({
            type: error.type,
            message: error.message,
            errors: [{ field: error.field, message: error.message }],
          });
        }
        const errMsg = error instanceof Error ? error.message : 'Failed to create student';
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
    if (!canWriteCollection(user, 'students')) return sendForbidden(reply);
    const parsed = parseRequest(studentsBulkStatusSchema, request.body);
    if (!parsed.ok) return replyValidationError(reply, parsed.message);
    try {
      const result = await studentUseCases.bulkUpdateStudentStatus(
        parsed.data.ids.map(String),
        parsed.data.status,
      );
      await auditStudent(
        user,
        'student.bulk_status',
        `Updated status to ${parsed.data.status} for ${result.succeeded} student(s); ${result.failed} failed`,
      );
      return reply.send({ success: true, ...result });
    } catch {
      return sendDatabaseError(reply, 'Failed to bulk update student status');
    }
  });

  fastify.post('/bulk-enroll', async (request, reply) => {
    const user = request.user as User;
    if (!canWriteCollection(user, 'students')) return sendForbidden(reply);
    const parsed = parseRequest(studentsBulkEnrollBodySchema, request.body);
    if (!parsed.ok) return replyValidationError(reply, parsed.message);
    try {
      const result = await studentUseCases.bulkEnrollStudents({
        studentIds: parsed.data.studentIds.map(String),
        sessionIds: parsed.data.sessionIds.map(String),
        mode: parsed.data.mode,
      });
      await auditStudent(
        user,
        'student.bulk_enroll',
        `Updated session enrollments (${parsed.data.mode}) for ${result.succeeded} student(s)`,
      );
      return reply.send({ success: true, ...result });
    } catch {
      return sendDatabaseError(reply, 'Failed to bulk update student session enrollments');
    }
  });

  fastify.get('/next-gr-number', async (request, reply) => {
    const user = request.user as User;
    if (!canReadCollection(user, 'students')) return sendForbidden(reply);
    const parsed = parseRequest(studentsNextGrNumberQuerySchema, request.query);
    if (!parsed.ok) return replyValidationError(reply, parsed.message);
    const query = parsed.data;
    const grNumber = await studentUseCases.computeNextGrNumberForDate(query.registeredDate, {
      grNumberTemplate: query.template ?? '{seq}-{year}',
      grNumberDigits: query.digits ?? 4,
      grNumberRestartAnnually: query.restartAnnually ?? true,
    });
    return reply.send({ grNumber });
  });

  fastify.post('/duplicate-check', async (request, reply) => {
    const user = request.user as User;
    if (!canWriteCollection(user, 'students')) return sendForbidden(reply);
    const parsed = parseRequest(studentsDuplicateCheckBodySchema, request.body);
    if (!parsed.ok) return replyValidationError(reply, parsed.message);
    try {
      const result = await studentUseCases.checkStudentRegistrationDuplicate(parsed.data);
      return reply.send(result);
    } catch {
      return sendDatabaseError(reply, 'Failed to check student registration duplicate');
    }
  });

  fastify.post('/migrate-gr-numbers', async (request, reply) => {
    const user = request.user as User;
    if (!roleHasPermission(user.role, STUDENTS_MODULE_MANIFEST.permissions.setupWrite)) {
      return sendForbidden(reply);
    }
    try {
      const result = await studentUseCases.migrateStudentsMissingGrNumbers();
      return reply.send({ success: true, ...result });
    } catch {
      return sendDatabaseError(reply, 'Failed to migrate student GR numbers');
    }
  });
}
