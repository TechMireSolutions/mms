import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { authenticateTenant } from '../middleware/authenticate.js';
import { canReadCollection, canWriteCollection } from '../services/rbacService.js';
import {
  createTeacher,
  deleteTeacherById,
  loadTeachers,
  updateTeacherById,
} from '../services/teacherService.js';
import type { User } from '@mms/shared';
import { sendForbidden } from '../lib/httpErrors.js';
import { resourceIdParamsSchema } from '../validation/commonSchemas.js';
import { teacherRecordSchema } from '../validation/teacherSchemas.js';
import { parseRequest, replyValidationError } from '../lib/zodRequest.js';

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
    try {
      return reply.send({ teachers: await loadTeachers() });
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
