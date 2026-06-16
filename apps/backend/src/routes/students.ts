import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { z } from 'zod';
import { authenticateTenant } from '../middleware/authenticate.js';
import { canReadCollection, canWriteCollection } from '../services/rbacService.js';
import {
  createStudent,
  deleteStudentById,
  loadStudents,
  parseStudentRecord,
  updateStudentById,
} from '../services/studentService.js';
import type { User } from '@mms/shared';
import { sendForbidden } from '../lib/httpErrors.js';

const studentIdParams = z.object({ id: z.string().min(1) });

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
    try {
      return reply.send({ students: await loadStudents() });
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

  fastify.post('/', async (request, reply) => {
    const user = request.user as User;
    if (!canWriteCollection(user, 'students')) return sendForbidden(reply);
    const parsed = parseStudentRecord(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ type: 'validation_error', message: parsed.error.message });
    }
    try {
      const student = await createStudent(parsed.data);
      return reply.status(201).send({ student });
    } catch {
      return reply.status(500).send({ type: 'database_error', message: 'Failed to create student' });
    }
  });

  fastify.put<{ Params: { id: string } }>('/:id', async (request, reply) => {
    const user = request.user as User;
    if (!canWriteCollection(user, 'students')) return sendForbidden(reply);
    const params = studentIdParams.safeParse(request.params);
    const body = parseStudentRecord(request.body);
    if (!params.success || !body.success) {
      return reply.status(400).send({ type: 'validation_error', message: 'Invalid student payload' });
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
    const params = studentIdParams.safeParse(request.params);
    if (!params.success) {
      return reply.status(400).send({ type: 'validation_error', message: 'Invalid student id' });
    }
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
