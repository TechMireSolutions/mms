import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { authenticateTenant } from '../../middleware/authenticate.js';
import { canDeleteCollection, canReadCollection, canWriteCollection } from '../../services/rbacService.js';
import {
  createStudent,
  deleteStudentById,
  restoreStudentById,
  bulkSoftDeleteStudents,
  bulkRestoreStudents,
  bulkUpdateStudentStatus,
  loadStudents,
  loadStudentsPage,
  loadStudentsByIds,
  loadStudentById,
  loadStudentLinkedContactIds,
  computeNextGrNumberForDate,
  checkStudentRegistrationDuplicate,
  loadStudentsWidgetAggregates,
  loadStudentsCommandMetrics,
  countStudents,
  updateStudentById,
  migrateStudentsMissingGrNumbers,
} from '../../services/studentService.js';
import type { User } from '@mms/shared';
import { STUDENTS_MODULE_MANIFEST, studentRecordSchema } from '@mms/shared';
import { sendDatabaseError, sendForbidden } from '../../lib/httpErrors.js';
import {
  studentsListQuerySchema,
  studentsNextGrNumberQuerySchema,
  studentsDuplicateCheckBodySchema,
  studentsBulkIdsSchema,
  studentsBulkStatusSchema,
} from '../../validation/studentSchemas.js';
import { parseRequest, replyValidationError } from '../../lib/zodRequest.js';
import { validateStudentDynamic } from '../../services/studentValidationService.js';
import { registerStandardTenantRoutes } from '../../lib/crudRouter.js';

/**
 * Server-first student resource routes (TanStack Query on FE).
 */
export default async function studentsRoutes(
  fastify: FastifyInstance,
  _options: FastifyPluginOptions,
): Promise<void> {
  fastify.addHook('preHandler', authenticateTenant);

  registerStandardTenantRoutes(fastify, {
    collection: 'students',
    schema: studentRecordSchema as never,
    listQuerySchema: studentsListQuerySchema,
    defaultPageSize: STUDENTS_MODULE_MANIFEST.defaultPageSize,
    errorMessagePrefix: 'students',
    nameSingular: 'student',
    namePlural: 'students',
    loadPageFn: (query) => loadStudentsPage(query),
    loadAllFn: loadStudents as never,
    loadCountFn: countStudents,
    loadByIdFn: loadStudentById as never,
    createFn: createStudent as never,
    updateFn: updateStudentById as never,
    deleteFn: deleteStudentById,
    restoreFn: restoreStudentById,
    loadMetricsFn: loadStudentsCommandMetrics,
    loadWidgetAggregatesFn: loadStudentsWidgetAggregates as unknown as (queries: unknown[]) => Promise<unknown>,
    loadByIdsFn: loadStudentsByIds as never,
    loadLinkedContactIdsFn: loadStudentLinkedContactIds,
    columnPreferencesObjectKey: STUDENTS_MODULE_MANIFEST.columnPreferencesObjectKey,
    validateDynamicFn: validateStudentDynamic as never,
    canWriteDeletedCheck: (user) => canDeleteCollection(user, 'students'),
  });

  fastify.post('/bulk-delete', async (request, reply) => {
    const user = request.user as User;
    if (!canDeleteCollection(user, 'students')) return sendForbidden(reply);
    const parsed = parseRequest(studentsBulkIdsSchema, request.body);
    if (!parsed.ok) return replyValidationError(reply, parsed.message);
    try {
      const result = await bulkSoftDeleteStudents(
        parsed.data.ids.map(String),
        String(user.id),
        parsed.data.deletionReason,
      );
      return reply.send({ success: true, ...result });
    } catch {
      return sendDatabaseError(reply, 'Failed to bulk delete students');
    }
  });

  fastify.post('/bulk-restore', async (request, reply) => {
    const user = request.user as User;
    if (!canDeleteCollection(user, 'students')) return sendForbidden(reply);
    const parsed = parseRequest(studentsBulkIdsSchema, request.body);
    if (!parsed.ok) return replyValidationError(reply, parsed.message);
    try {
      const result = await bulkRestoreStudents(parsed.data.ids.map(String));
      return reply.send({ success: true, ...result });
    } catch {
      return sendDatabaseError(reply, 'Failed to bulk restore students');
    }
  });

  fastify.post('/bulk-status', async (request, reply) => {
    const user = request.user as User;
    if (!canWriteCollection(user, 'students')) return sendForbidden(reply);
    const parsed = parseRequest(studentsBulkStatusSchema, request.body);
    if (!parsed.ok) return replyValidationError(reply, parsed.message);
    try {
      const result = await bulkUpdateStudentStatus(parsed.data.ids.map(String), parsed.data.status);
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
    if (!canWriteCollection(user, 'students')) return sendForbidden(reply);
    try {
      const result = await migrateStudentsMissingGrNumbers();
      return reply.send({ success: true, ...result });
    } catch {
      return sendDatabaseError(reply, 'Failed to migrate student GR numbers');
    }
  });
}
