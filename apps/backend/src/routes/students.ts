import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { authenticateTenant } from '../middleware/authenticate.js';
import { canReadCollection, canWriteCollection } from '../services/rbacService.js';
import {
  createStudent,
  deleteStudentById,
  loadStudents,
  loadStudentsPage,
  loadStudentsByIds,
  loadStudentById,
  loadStudentLinkedContactIds,
  computeNextGrNumberForDate,
  checkStudentRegistrationDuplicate,
  loadStudentsWidgetAggregates,
  updateStudentById,
} from '../services/studentService.js';
import type { User } from '@mms/shared';
import { STUDENTS_MODULE_CONTRACT, computeStudentsCommandMetrics } from '@mms/shared';
import { sendForbidden } from '../lib/httpErrors.js';
import { resourceIdParamsSchema } from '../validation/commonSchemas.js';
import { moduleColumnPrefsBodySchema } from '../validation/moduleColumnPrefsSchemas.js';
import { studentRecordSchema, studentsListQuerySchema, studentsResolveBodySchema, studentsWidgetAggregatesBodySchema, studentsNextGrNumberQuerySchema, studentsDuplicateCheckBodySchema, studentsLinkedContactIdsQuerySchema } from '../validation/studentSchemas.js';
import { parseRequest, replyValidationError } from '../lib/zodRequest.js';
import {
  getUserColumnPrefsForModule,
  setUserColumnPrefsForModule,
} from '../services/userColumnPrefsService.js';

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
      const q = queryParsed.data;
      const page = await loadStudentsPage({
        page: q.page,
        limit: q.limit ?? STUDENTS_MODULE_CONTRACT.defaultPageSize,
        search: q.search,
        status: q.status,
        gender: q.gender,
        sortField: q.sortField,
        sortDir: q.sortDir,
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
      const q = parsed.data;
      const grNumber = await computeNextGrNumberForDate(q.registeredDate, {
        grNumberTemplate: q.template ?? '{seq}-{year}',
        grNumberDigits: q.digits ?? 4,
        grNumberRestartAnnually: q.restartAnnually ?? true,
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

  fastify.get('/column-prefs', async (request, reply) => {
    const user = request.user as User;
    if (!canReadCollection(user, 'students')) return sendForbidden(reply);
    try {
      const prefs = await getUserColumnPrefsForModule(
        STUDENTS_MODULE_CONTRACT.columnPrefsObjectKey,
        String(user.id),
      );
      return reply.send({ prefs });
    } catch {
      return reply.status(500).send({ type: 'database_error', message: 'Failed to load column preferences' });
    }
  });

  fastify.put('/column-prefs', async (request, reply) => {
    const user = request.user as User;
    if (!canReadCollection(user, 'students')) return sendForbidden(reply);
    const parsed = parseRequest(moduleColumnPrefsBodySchema, request.body);
    if (!parsed.ok) return replyValidationError(reply, parsed.message);
    try {
      await setUserColumnPrefsForModule(
        STUDENTS_MODULE_CONTRACT.columnPrefsObjectKey,
        String(user.id),
        parsed.data.prefs,
      );
      return reply.send({ success: true, prefs: parsed.data.prefs });
    } catch {
      return reply.status(500).send({ type: 'database_error', message: 'Failed to save column preferences' });
    }
  });

  fastify.post('/', async (request, reply) => {
    const user = request.user as User;
    if (!canWriteCollection(user, 'students')) return sendForbidden(reply);
    const parsed = parseRequest(studentRecordSchema, request.body);
    if (!parsed.ok) return replyValidationError(reply, parsed.message);
    try {
      const student = await createStudent(parsed.data);
      return reply.status(201).send({ student });
    } catch {
      return reply.status(500).send({ type: 'database_error', message: 'Failed to create student' });
    }
  });

  fastify.put('/:id', async (request, reply) => {
    const user = request.user as User;
    if (!canWriteCollection(user, 'students')) return sendForbidden(reply);
    const params = parseRequest(resourceIdParamsSchema, request.params);
    const body = parseRequest(studentRecordSchema, request.body);
    if (!params.ok) return replyValidationError(reply, params.message);
    if (!body.ok) return replyValidationError(reply, body.message);
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
    try {
      const deleted = await deleteStudentById(params.data.id);
      if (!deleted) {
        return reply.status(404).send({ type: 'not_found', message: 'Student not found' });
      }
      return reply.send({ success: true });
    } catch {
      return reply.status(500).send({ type: 'database_error', message: 'Failed to delete student' });
    }
  });
}
