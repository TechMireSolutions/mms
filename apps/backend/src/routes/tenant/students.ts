import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { authenticateTenant } from '../../middleware/authenticate.js';
import { canReadCollection, canWriteCollection } from '../../services/rbacService.js';
import {
  createStudent,
  deleteStudentById,
  restoreStudentById,
  loadStudents,
  loadStudentsPage,
  loadStudentsByIds,
  loadStudentById,
  loadStudentLinkedContactIds,
  computeNextGrNumberForDate,
  checkStudentRegistrationDuplicate,
  loadStudentsWidgetAggregates,
  updateStudentById,
} from '../../services/studentService.js';
import type { User } from '@mms/shared';
import { STUDENTS_MODULE_CONTRACT, computeStudentsCommandMetrics } from '@mms/shared';
import { sendForbidden, sendDatabaseError } from '../../lib/httpErrors.js';
import { studentRecordSchema, studentsListQuerySchema, studentsNextGrNumberQuerySchema, studentsDuplicateCheckBodySchema } from '../../validation/studentSchemas.js';
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

  // --- Register Standard Tenant Routes ---
  registerStandardTenantRoutes(fastify, {
    collection: 'students',
    schema: studentRecordSchema,
    listQuerySchema: studentsListQuerySchema,
    defaultPageSize: STUDENTS_MODULE_CONTRACT.defaultPageSize,
    errorMessagePrefix: 'students',
    nameSingular: 'student',
    namePlural: 'students',
    loadPageFn: (query) => loadStudentsPage(query),
    loadAllFn: loadStudents,
    loadByIdFn: loadStudentById,
    createFn: createStudent,
    updateFn: updateStudentById,
    deleteFn: deleteStudentById,
    restoreFn: restoreStudentById,
    computeMetricsFn: (students) => computeStudentsCommandMetrics(students),
    loadWidgetAggregatesFn: loadStudentsWidgetAggregates,
    loadByIdsFn: loadStudentsByIds,
    loadLinkedContactIdsFn: loadStudentLinkedContactIds,
    columnPreferencesObjectKey: STUDENTS_MODULE_CONTRACT.columnPreferencesObjectKey,
    validateDynamicFn: validateStudentDynamic,
  });

  // --- Custom GET Next GR Number ---
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

  // --- Custom POST Duplicate Check ---
  fastify.post('/duplicate-check', async (request, reply) => {
    const user = request.user as User;
    if (!canWriteCollection(user, 'students')) return sendForbidden(reply);
    const parsed = parseRequest(studentsDuplicateCheckBodySchema, request.body);
    if (!parsed.ok) return replyValidationError(reply, parsed.message);
    const result = await checkStudentRegistrationDuplicate(parsed.data);
    return reply.send(result);
  });
}
