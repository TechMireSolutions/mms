import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { authenticateTenant } from '../middleware/authenticate.js';
import { canReadCollection, canWriteCollection } from '../services/rbacService.js';
import {
  createTeacher,
  deleteTeacherById,
  loadTeachers,
  loadTeachersPage,
  loadTeachersByIds,
  loadTeacherById,
  loadTeacherLinkedContactIds,
  computeNextTeacherEmployeeIdForSettings,
  loadTeachersWidgetAggregates,
  updateTeacherById,
} from '../services/teacherService.js';
import type { User } from '@mms/shared';
import { TEACHERS_MODULE_CONTRACT, computeTeachersCommandMetrics } from '@mms/shared';
import { sendForbidden } from '../lib/httpErrors.js';
import { resourceIdParamsSchema } from '../validation/commonSchemas.js';
import { moduleColumnPreferencesBodySchema } from '../validation/moduleColumnPreferencesSchemas.js';
import { teacherRecordSchema, teachersListQuerySchema, teachersResolveBodySchema, teachersWidgetAggregatesBodySchema, teachersNextEmployeeIdQuerySchema, teachersLinkedContactIdsQuerySchema } from '../validation/teacherSchemas.js';
import { parseRequest, replyValidationError } from '../lib/zodRequest.js';
import {
  getUserColumnPreferencesForModule,
  setUserColumnPreferencesForModule,
} from '../services/userColumnPreferencesService.js';

/**
 * Server-first teacher resource routes (TanStack Query on FE).
 */
export default async function teachersRoutes(
  fastify: FastifyInstance,
  _options: FastifyPluginOptions,
): Promise<void> {
  fastify.addHook('preHandler', authenticateTenant);

  fastify.get('/', async (request, reply) => {
    const user = request.user as User;
    if (!canReadCollection(user, 'teachers')) return sendForbidden(reply);
    const queryParsed = parseRequest(teachersListQuerySchema, request.query);
    if (!queryParsed.ok) return replyValidationError(reply, queryParsed.message);
    try {
      const query = queryParsed.data;
      const page = await loadTeachersPage({
        page: query.page,
        limit: query.limit ?? TEACHERS_MODULE_CONTRACT.defaultPageSize,
        search: query.search,
        status: query.status,
        specialization: query.specialization,
        sortField: query.sortField,
        sortDir: query.sortDir,
      });
      return reply.send(page);
    } catch {
      return reply.status(500).send({ type: 'database_error', message: 'Failed to list teachers' });
    }
  });

  fastify.get('/count', async (request, reply) => {
    const user = request.user as User;
    if (!canReadCollection(user, 'teachers')) return sendForbidden(reply);
    try {
      const teachers = await loadTeachers();
      return reply.send({ count: teachers.length });
    } catch {
      return reply.status(500).send({ type: 'database_error', message: 'Failed to count teachers' });
    }
  });

  fastify.get('/metrics', async (request, reply) => {
    const user = request.user as User;
    if (!canReadCollection(user, 'teachers')) return sendForbidden(reply);
    try {
      const teachers = await loadTeachers();
      return reply.send({ metrics: computeTeachersCommandMetrics(teachers) });
    } catch {
      return reply.status(500).send({ type: 'database_error', message: 'Failed to load teacher metrics' });
    }
  });

  fastify.post('/widget-aggregates', async (request, reply) => {
    const user = request.user as User;
    if (!canReadCollection(user, 'teachers')) return sendForbidden(reply);
    const parsed = parseRequest(teachersWidgetAggregatesBodySchema, request.body);
    if (!parsed.ok) return replyValidationError(reply, parsed.message);
    try {
      const results = await loadTeachersWidgetAggregates(parsed.data.widgets);
      return reply.send({ results });
    } catch {
      return reply.status(500).send({ type: 'database_error', message: 'Failed to load teacher widget aggregates' });
    }
  });

  fastify.post('/resolve', async (request, reply) => {
    const user = request.user as User;
    if (!canReadCollection(user, 'teachers')) return sendForbidden(reply);
    const parsed = parseRequest(teachersResolveBodySchema, request.body);
    if (!parsed.ok) return replyValidationError(reply, parsed.message);
    try {
      return reply.send({ teachers: await loadTeachersByIds(parsed.data.ids) });
    } catch {
      return reply.status(500).send({ type: 'database_error', message: 'Failed to resolve teachers' });
    }
  });

  fastify.get('/next-employee-id', async (request, reply) => {
    const user = request.user as User;
    if (!canReadCollection(user, 'teachers')) return sendForbidden(reply);
    const parsed = parseRequest(teachersNextEmployeeIdQuerySchema, request.query);
    if (!parsed.ok) return replyValidationError(reply, parsed.message);
    try {
      const employeeId = await computeNextTeacherEmployeeIdForSettings({
        idPrefix: parsed.data.prefix ?? 'TCH',
      });
      return reply.send({ employeeId });
    } catch {
      return reply.status(500).send({ type: 'database_error', message: 'Failed to compute employee id' });
    }
  });

  fastify.get('/linked-contact-ids', async (request, reply) => {
    const user = request.user as User;
    if (!canReadCollection(user, 'teachers')) return sendForbidden(reply);
    const parsed = parseRequest(teachersLinkedContactIdsQuerySchema, request.query);
    if (!parsed.ok) return replyValidationError(reply, parsed.message);
    try {
      const contactIds = await loadTeacherLinkedContactIds(parsed.data.excludeId);
      return reply.send({ contactIds });
    } catch {
      return reply.status(500).send({ type: 'database_error', message: 'Failed to load linked contact ids' });
    }
  });

  fastify.get('/:id', async (request, reply) => {
    const user = request.user as User;
    if (!canReadCollection(user, 'teachers')) return sendForbidden(reply);
    const params = parseRequest(resourceIdParamsSchema, request.params);
    if (!params.ok) return replyValidationError(reply, params.message);
    try {
      const teacher = await loadTeacherById(params.data.id);
      if (!teacher) {
        return reply.status(404).send({ type: 'not_found', message: 'Teacher not found' });
      }
      return reply.send({ teacher });
    } catch {
      return reply.status(500).send({ type: 'database_error', message: 'Failed to load teacher' });
    }
  });

  fastify.get('/column-preferences', async (request, reply) => {
    const user = request.user as User;
    if (!canReadCollection(user, 'teachers')) return sendForbidden(reply);
    try {
      const preferences = await getUserColumnPreferencesForModule(
        TEACHERS_MODULE_CONTRACT.columnPreferencesObjectKey,
        String(user.id),
      );
      return reply.send({ preferences });
    } catch {
      return reply.status(500).send({ type: 'database_error', message: 'Failed to load column preferences' });
    }
  });

  fastify.put('/column-preferences', async (request, reply) => {
    const user = request.user as User;
    if (!canReadCollection(user, 'teachers')) return sendForbidden(reply);
    const parsed = parseRequest(moduleColumnPreferencesBodySchema, request.body);
    if (!parsed.ok) return replyValidationError(reply, parsed.message);
    try {
      await setUserColumnPreferencesForModule(
        TEACHERS_MODULE_CONTRACT.columnPreferencesObjectKey,
        String(user.id),
        parsed.data.preferences,
      );
      return reply.send({ success: true, preferences: parsed.data.preferences });
    } catch {
      return reply.status(500).send({ type: 'database_error', message: 'Failed to save column preferences' });
    }
  });

  fastify.post('/', async (request, reply) => {
    const user = request.user as User;
    if (!canWriteCollection(user, 'teachers')) return sendForbidden(reply);
    const parsed = parseRequest(teacherRecordSchema, request.body);
    if (!parsed.ok) return replyValidationError(reply, parsed.message);
    try {
      const teacher = await createTeacher(parsed.data);
      return reply.status(201).send({ teacher });
    } catch {
      return reply.status(500).send({ type: 'database_error', message: 'Failed to create teacher' });
    }
  });

  fastify.put('/:id', async (request, reply) => {
    const user = request.user as User;
    if (!canWriteCollection(user, 'teachers')) return sendForbidden(reply);
    const params = parseRequest(resourceIdParamsSchema, request.params);
    const body = parseRequest(teacherRecordSchema, request.body);
    if (!params.ok) return replyValidationError(reply, params.message);
    if (!body.ok) return replyValidationError(reply, body.message);
    try {
      const updated = await updateTeacherById(params.data.id, {
        ...body.data,
        id: body.data.id ?? params.data.id,
      });
      if (!updated) {
        return reply.status(404).send({ type: 'not_found', message: 'Teacher not found' });
      }
      return reply.send({ teacher: updated });
    } catch {
      return reply.status(500).send({ type: 'database_error', message: 'Failed to update teacher' });
    }
  });

  fastify.delete<{ Params: { id: string } }>('/:id', async (request, reply) => {
    const user = request.user as User;
    if (!canWriteCollection(user, 'teachers')) return sendForbidden(reply);
    const params = parseRequest(resourceIdParamsSchema, request.params);
    if (!params.ok) return replyValidationError(reply, params.message);
    try {
      const deleted = await deleteTeacherById(params.data.id);
      if (!deleted) {
        return reply.status(404).send({ type: 'not_found', message: 'Teacher not found' });
      }
      return reply.send({ success: true });
    } catch {
      return reply.status(500).send({ type: 'database_error', message: 'Failed to delete teacher' });
    }
  });
}
