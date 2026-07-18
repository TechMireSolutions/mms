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
import { resourceIdParamsSchema } from '../../validation/commonSchemas.js';
import { studentRecordSchema, studentsListQuerySchema, studentsNextGrNumberQuerySchema, studentsDuplicateCheckBodySchema } from '../../validation/studentSchemas.js';
import { parseRequest, replyValidationError, executeDynamicValidation } from '../../lib/zodRequest.js';
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
    deleteFn: deleteStudentById,
    restoreFn: restoreStudentById,
    customPostRoute: true,
    customPutRoute: true,
    computeMetricsFn: (students) => computeStudentsCommandMetrics(students),
    loadWidgetAggregatesFn: loadStudentsWidgetAggregates,
    loadByIdsFn: loadStudentsByIds,
    loadLinkedContactIdsFn: loadStudentLinkedContactIds,
    columnPreferencesObjectKey: STUDENTS_MODULE_CONTRACT.columnPreferencesObjectKey,
  });

  // --- Custom GET Next GR Number ---
  fastify.get('/next-gr-number', async (request, reply) => {
    const user = request.user as User;
    if (!canReadCollection(user, 'students')) return sendForbidden(reply);
    const parsed = parseRequest(studentsNextGrNumberQuerySchema, request.query);
    if (!parsed.ok) return replyValidationError(reply, parsed.message);
    try {
      const query = parsed.data;
      const grNumber = await computeNextGrNumberForDate(query.registeredDate, {
        grNumberTemplate: query.template ?? '{seq}-{year}',
        grNumberDigits: query.digits ?? 4,
        grNumberRestartAnnually: query.restartAnnually ?? true,
      });
      return reply.send({ grNumber });
    } catch {
      return sendDatabaseError(reply, 'Failed to compute GR number');
    }
  });

  // --- Custom POST Duplicate Check ---
  fastify.post('/duplicate-check', async (request, reply) => {
    const user = request.user as User;
    if (!canWriteCollection(user, 'students')) return sendForbidden(reply);
    const parsed = parseRequest(studentsDuplicateCheckBodySchema, request.body);
    if (!parsed.ok) return replyValidationError(reply, parsed.message);
    try {
      return reply.send(await checkStudentRegistrationDuplicate(parsed.data));
    } catch {
      return sendDatabaseError(reply, 'Failed to check student duplicates');
    }
  });


  // --- Custom POST Create (Dynamic Validation) ---
  fastify.post('/', {
    bodyLimit: 1048576, // 1MB limit for dynamic payloads (Rule 16.2)
    schema: { body: { type: 'object', additionalProperties: true } },
  }, async (request, reply) => {
    const user = request.user as User;
    if (!canWriteCollection(user, 'students')) return sendForbidden(reply);
    const parsed = parseRequest(studentRecordSchema, request.body);
    if (!parsed.ok) return replyValidationError(reply, parsed.message);

    const isValid = await executeDynamicValidation(request, reply, (tenant, lang) =>
      validateStudentDynamic(tenant, parsed.data, lang)
    );
    if (!isValid) return;

    try {
      const student = await createStudent(parsed.data);
      return reply.status(201).send({ student });
    } catch {
      return sendDatabaseError(reply, 'Failed to create student');
    }
  });

  // --- Custom PUT Update (Dynamic Validation) ---
  fastify.put('/:id', {
    bodyLimit: 1048576, // 1MB limit for dynamic payloads (Rule 16.2)
    schema: { body: { type: 'object', additionalProperties: true } },
  }, async (request, reply) => {
    const user = request.user as User;
    if (!canWriteCollection(user, 'students')) return sendForbidden(reply);
    const params = parseRequest(resourceIdParamsSchema, request.params);
    const body = parseRequest(studentRecordSchema, request.body);
    if (!params.ok) return replyValidationError(reply, params.message);
    if (!body.ok) return replyValidationError(reply, body.message);

    const isValid = await executeDynamicValidation(request, reply, (tenant, lang) =>
      validateStudentDynamic(tenant, body.data, lang)
    );
    if (!isValid) return;

    try {
      const updated = await updateStudentById(params.data.id, {
        ...body.data,
        id: body.data.id ?? params.data.id,
      });
      if (!updated) {
        return reply.status(404).send({ type: 'not_found', message: 'Student not found' });
      }
      return reply.send({ student: updated });
    } catch {
      return sendDatabaseError(reply, 'Failed to update student');
    }
  });

}
