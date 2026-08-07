import type { FastifyInstance } from 'fastify';
import type { User } from '@mms/shared';
import {
  STUDENTS_MODULE_MANIFEST,
  roleHasPermission,
} from '@mms/shared';
import { canReadCollection, canWriteCollection } from '../../../services/rbacService.js';
import {
  bulkUpdateStudentStatus,
  computeNextGrNumberForDate,
  checkStudentRegistrationDuplicate,
  migrateStudentsMissingGrNumbers,
} from '../../../services/studentService.js';
import {
  studentsBulkStatusSchema,
  studentsDuplicateCheckBodySchema,
  studentsNextGrNumberQuerySchema,
} from '../../../validation/studentSchemas.js';
import { parseRequest, replyValidationError } from '../../../lib/zodRequest.js';
import { sendDatabaseError, sendForbidden } from '../../../lib/httpErrors.js';
import { auditStudent } from './studentRouteHelpers.js';

/** Students domain operations (GR, bulk status, duplicate check) — not generic CRUD. */
export async function studentOperationRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.post('/bulk-status', async (request, reply) => {
    const user = request.user as User;
    if (!canWriteCollection(user, 'students')) return sendForbidden(reply);
    const parsed = parseRequest(studentsBulkStatusSchema, request.body);
    if (!parsed.ok) return replyValidationError(reply, parsed.message);
    try {
      const result = await bulkUpdateStudentStatus(parsed.data.ids.map(String), parsed.data.status);
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

  fastify.get('/next-gr-number', async (request, reply) => {
    const user = request.user as User;
    if (!canReadCollection(user, 'students')) return sendForbidden(reply);
    const parsed = parseRequest(studentsNextGrNumberQuerySchema, request.query);
    if (!parsed.ok) return replyValidationError(reply, parsed.message);
    const query = parsed.data;
    const grNumber = await computeNextGrNumberForDate(query.registeredDate, {
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
    const result = await checkStudentRegistrationDuplicate(parsed.data);
    return reply.send(result);
  });

  fastify.post('/migrate-gr-numbers', async (request, reply) => {
    const user = request.user as User;
    if (!roleHasPermission(user.role, STUDENTS_MODULE_MANIFEST.permissions.setupWrite)) {
      return sendForbidden(reply);
    }
    try {
      const result = await migrateStudentsMissingGrNumbers();
      return reply.send({ success: true, ...result });
    } catch {
      return sendDatabaseError(reply, 'Failed to migrate student GR numbers');
    }
  });
}
