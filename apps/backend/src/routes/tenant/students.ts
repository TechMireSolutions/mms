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
import { resourceIdParamsSchema, softDeleteBodySchema } from '../../validation/commonSchemas.js';
import { registerColumnPreferencesRoutes } from '../../lib/columnPreferencesRouter.js';
import { studentRecordSchema, studentsListQuerySchema, studentsResolveBodySchema, studentsWidgetAggregatesBodySchema, studentsNextGrNumberQuerySchema, studentsDuplicateCheckBodySchema, studentsLinkedContactIdsQuerySchema } from '../../validation/studentSchemas.js';
import { parseRequest, replyValidationError } from '../../lib/zodRequest.js';
import { getRequestTenant } from '../../lib/tenantContext.js';
import { validateStudentDynamic } from '../../services/studentValidationService.js';


/**
 * Server-first student resource routes (TanStack Query on FE).
 */
export default async function studentsRoutes(
  fastify: FastifyInstance,
  _options: FastifyPluginOptions,
): Promise<void> {
  fastify.addHook('preHandler', authenticateTenant);

  fastify.get('/', async (request, reply) => {
    const user = request.user as User;
    if (!canReadCollection(user, 'students')) return sendForbidden(reply);
    const queryParsed = parseRequest(studentsListQuerySchema, request.query);
    if (!queryParsed.ok) return replyValidationError(reply, queryParsed.message);
    try {
      const query = queryParsed.data;
      const includeDeleted = query.includeDeleted === 'true';
      if (includeDeleted && !canWriteCollection(user, 'students')) {
        return sendForbidden(reply);
      }
      const page = await loadStudentsPage({
        page: query.page,
        limit: query.limit ?? STUDENTS_MODULE_CONTRACT.defaultPageSize,
        search: query.search,
        status: query.status,
        gender: query.gender,
        sortField: query.sortField,
        sortDir: query.sortDir,
        includeDeleted,
      });
      return reply.send(page);
    } catch {
      return reply.status(500).send({ type: 'database_error', message: 'Failed to list students' });
    }
  });

  fastify.get('/count', async (request, reply) => {
    const user = request.user as User;
    if (!canReadCollection(user, 'students')) return sendForbidden(reply);
    try {
      const students = await loadStudents();
      return reply.send({ count: students.length });
    } catch {
      return reply.status(500).send({ type: 'database_error', message: 'Failed to count students' });
    }
  });

  fastify.get('/metrics', async (request, reply) => {
    const user = request.user as User;
    if (!canReadCollection(user, 'students')) return sendForbidden(reply);
    try {
      const students = await loadStudents();
      return reply.send({ metrics: computeStudentsCommandMetrics(students) });
    } catch {
      return reply.status(500).send({ type: 'database_error', message: 'Failed to load student metrics' });
    }
  });

  fastify.post('/widget-aggregates', async (request, reply) => {
    const user = request.user as User;
    if (!canReadCollection(user, 'students')) return sendForbidden(reply);
    const parsed = parseRequest(studentsWidgetAggregatesBodySchema, request.body);
    if (!parsed.ok) return replyValidationError(reply, parsed.message);
    try {
      const results = await loadStudentsWidgetAggregates(parsed.data.widgets);
      return reply.send({ results });
    } catch {
      return reply.status(500).send({ type: 'database_error', message: 'Failed to load student widget aggregates' });
    }
  });

  fastify.post('/resolve', async (request, reply) => {
    const user = request.user as User;
    if (!canReadCollection(user, 'students')) return sendForbidden(reply);
    const parsed = parseRequest(studentsResolveBodySchema, request.body);
    if (!parsed.ok) return replyValidationError(reply, parsed.message);
    try {
      return reply.send({ students: await loadStudentsByIds(parsed.data.ids) });
    } catch {
      return reply.status(500).send({ type: 'database_error', message: 'Failed to resolve students' });
    }
  });

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

  fastify.get('/linked-contact-ids', async (request, reply) => {
    const user = request.user as User;
    if (!canReadCollection(user, 'students')) return sendForbidden(reply);
    const parsed = parseRequest(studentsLinkedContactIdsQuerySchema, request.query);
    if (!parsed.ok) return replyValidationError(reply, parsed.message);
    try {
      const contactIds = await loadStudentLinkedContactIds(parsed.data.excludeId);
      return reply.send({ contactIds });
    } catch {
      return reply.status(500).send({ type: 'database_error', message: 'Failed to load linked contact ids' });
    }
  });

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

  fastify.get('/:id', async (request, reply) => {
    const user = request.user as User;
    if (!canReadCollection(user, 'students')) return sendForbidden(reply);
    const params = parseRequest(resourceIdParamsSchema, request.params);
    if (!params.ok) return replyValidationError(reply, params.message);
    try {
      const student = await loadStudentById(params.data.id);
      if (!student) {
        return reply.status(404).send({ type: 'not_found', message: 'Student not found' });
      }
      return reply.send({ student });
    } catch {
      return reply.status(500).send({ type: 'database_error', message: 'Failed to load student' });
    }
  });

  registerColumnPreferencesRoutes(fastify, {
    collection: 'students',
    objectKey: STUDENTS_MODULE_CONTRACT.columnPreferencesObjectKey,
  });

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

  fastify.delete<{ Params: { id: string } }>('/:id', async (request, reply) => {
    const user = request.user as User;
    if (!canWriteCollection(user, 'students')) return sendForbidden(reply);
    const params = parseRequest(resourceIdParamsSchema, request.params);
    if (!params.ok) return replyValidationError(reply, params.message);
    const body = parseRequest(softDeleteBodySchema, request.body ?? {});
    if (!body.ok) return replyValidationError(reply, body.message);
    try {
      const deleted = await deleteStudentById(params.data.id, String(user.id), body.data.deletionReason);
      if (!deleted) {
        return reply.status(404).send({ type: 'not_found', message: 'Student not found' });
      }
      return reply.send({ success: true });
    } catch {
      return reply.status(500).send({ type: 'database_error', message: 'Failed to delete student' });
    }
  });

  fastify.post('/:id/restore', async (request, reply) => {
    const user = request.user as User;
    if (!canWriteCollection(user, 'students')) return sendForbidden(reply);
    const params = parseRequest(resourceIdParamsSchema, request.params);
    if (!params.ok) return replyValidationError(reply, params.message);
    try {
      const restored = await restoreStudentById(params.data.id);
      if (!restored) {
        return reply.status(404).send({ type: 'not_found', message: 'Student not found or not deleted' });
      }
      return reply.send({ success: true });
    } catch {
      return reply.status(500).send({ type: 'database_error', message: 'Failed to restore student' });
    }
  });
}
