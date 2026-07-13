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
import { sendForbidden } from '../../lib/httpErrors.js';
import { resourceIdParamsSchema } from '../../validation/commonSchemas.js';
import { registerColumnPreferencesRoutes } from '../../lib/columnPreferencesRouter.js';
import { studentRecordSchema, studentsListQuerySchema, studentsNextGrNumberQuerySchema, studentsDuplicateCheckBodySchema } from '../../validation/studentSchemas.js';
import { parseRequest, replyValidationError } from '../../lib/zodRequest.js';
import { getRequestTenant } from '../../lib/tenantContext.js';
import { validateStudentDynamic } from '../../services/studentValidationService.js';
import {
  registerResourceRoutes,
  registerMetricsRoute,
  registerCountRoute,
  registerResolveRoute,
  registerWidgetAggregatesRoute,
  registerLinkedContactIdsRoute,
  registerPaginatedListRoute,
} from '../../lib/crudRouter.js';

/**
 * Server-first student resource routes (TanStack Query on FE).
 */
export default async function studentsRoutes(
  fastify: FastifyInstance,
  _options: FastifyPluginOptions,
): Promise<void> {
  fastify.addHook('preHandler', authenticateTenant);

  // --- Custom GET List (Paginated) ---
  registerPaginatedListRoute(fastify, {
    collection: 'students',
    schema: studentsListQuerySchema,
    defaultPageSize: STUDENTS_MODULE_CONTRACT.defaultPageSize,
    errorMessagePrefix: 'students',
    loadPageFn: (query) => loadStudentsPage(query),
  });


  // --- Custom GET Count ---
  registerCountRoute(fastify, {
    collection: 'students',
    loadAllFn: loadStudents,
    errorMessagePrefix: 'students',
  });

  // --- Custom GET Metrics ---
  registerMetricsRoute(fastify, {
    collection: 'students',
    loadMetricsFn: async () => {
      const students = await loadStudents();
      return computeStudentsCommandMetrics(students);
    },
    errorMessagePrefix: 'student',
  });

  // --- Custom POST Widget Aggregates ---
  registerWidgetAggregatesRoute(fastify, {
    collection: 'students',
    loadAggregatesFn: loadStudentsWidgetAggregates,
    errorMessagePrefix: 'student',
  });

  // --- Custom POST Resolve ---
  registerResolveRoute(fastify, {
    collection: 'students',
    loadByIdsFn: loadStudentsByIds,
    responseKey: 'students',
    errorMessagePrefix: 'students',
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
      return reply.status(500).send({ type: 'database_error', message: 'Failed to compute GR number' });
    }
  });

  // --- Custom GET Linked Contact IDs ---
  registerLinkedContactIdsRoute(fastify, {
    collection: 'students',
    loadLinkedContactIdsFn: loadStudentLinkedContactIds,
    errorMessagePrefix: 'students',
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
      return reply.status(500).send({ type: 'database_error', message: 'Failed to check student duplicates' });
    }
  });

  registerColumnPreferencesRoutes(fastify, {
    collection: 'students',
    objectKey: STUDENTS_MODULE_CONTRACT.columnPreferencesObjectKey,
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

    const tenant = getRequestTenant();
    if (!tenant) {
      return reply.status(403).send({ type: 'forbidden', message: 'Tenant required' });
    }

    try {
      const lang = (request.headers['accept-language'] as string) || 'en';
      await validateStudentDynamic(tenant, parsed.data, lang);
    } catch (error) {
      return replyValidationError(reply, error instanceof Error ? error.message : String(error));
    }

    try {
      const student = await createStudent(parsed.data);
      return reply.status(201).send({ student });
    } catch {
      return reply.status(500).send({ type: 'database_error', message: 'Failed to create student' });
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

    const tenant = getRequestTenant();
    if (!tenant) {
      return reply.status(403).send({ type: 'forbidden', message: 'Tenant required' });
    }

    try {
      const lang = (request.headers['accept-language'] as string) || 'en';
      await validateStudentDynamic(tenant, body.data, lang);
    } catch (error) {
      return replyValidationError(reply, error instanceof Error ? error.message : String(error));
    }

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
      return reply.status(500).send({ type: 'database_error', message: 'Failed to update student' });
    }
  });

  // --- Resource Delete & Restore ---
  registerResourceRoutes(fastify, {
    customGetRoute: true,
    customPostRoute: true,
    customPutRoute: true,
    collection: 'students',
    schema: studentRecordSchema,
    loadByIdFn: loadStudentById,
    deleteFn: deleteStudentById,
    restoreFn: restoreStudentById,
    nameSingular: 'student',
    namePlural: 'students',
  });
}
