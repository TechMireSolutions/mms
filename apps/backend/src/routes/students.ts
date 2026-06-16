import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { z } from 'zod';
import { authenticateTenant } from '../middleware/authenticate.js';
import { fetchCollection, persistCollection } from '../services/dbSyncService.js';
import { canWriteCollection } from '../services/rbacService.js';
import type { User } from '../services/authService.js';
import { studentListSchema, studentRecordSchema } from '../validation/studentSchemas.js';

const studentIdParams = z.object({ id: z.string().min(1) });

/**
 * Server-first student resource routes (TanStack Query on FE).
 */
export default async function studentsRoutes(
  fastify: FastifyInstance,
  _options: FastifyPluginOptions
): Promise<void> {
  fastify.addHook('preHandler', authenticateTenant);

  fastify.get('/', async (_request, reply) => {
    try {
      const data = await fetchCollection('students');
      const parsed = studentListSchema.safeParse(data ?? []);
      if (!parsed.success) {
        return reply.status(500).send({ type: 'validation_error', message: 'Invalid students data' });
      }
      return reply.send({ students: parsed.data });
    } catch {
      return reply.status(500).send({ type: 'database_error', message: 'Failed to list students' });
    }
  });

  fastify.get('/count', async (_request, reply) => {
    try {
      const data = await fetchCollection('students');
      const count = Array.isArray(data) ? data.length : 0;
      return reply.send({ count });
    } catch {
      return reply.status(500).send({ type: 'database_error', message: 'Failed to count students' });
    }
  });

  fastify.post('/', async (request, reply) => {
    const user = request.user as User;
    if (!canWriteCollection(user, 'students')) {
      return reply.status(403).send({ type: 'forbidden', message: 'Insufficient permissions' });
    }
    const parsed = studentRecordSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ type: 'validation_error', message: parsed.error.message });
    }
    const existing = (await fetchCollection('students')) ?? [];
    const list = Array.isArray(existing) ? [...existing] : [];
    list.push(parsed.data);
    await persistCollection('students', list);
    return reply.status(201).send({ student: parsed.data });
  });

  fastify.put<{ Params: { id: string } }>('/:id', async (request, reply) => {
    const user = request.user as User;
    if (!canWriteCollection(user, 'students')) {
      return reply.status(403).send({ type: 'forbidden', message: 'Insufficient permissions' });
    }
    const params = studentIdParams.safeParse(request.params);
    const body = studentRecordSchema.safeParse(request.body);
    if (!params.success || !body.success) {
      return reply.status(400).send({ type: 'validation_error', message: 'Invalid student payload' });
    }
    const existing = (await fetchCollection('students')) ?? [];
    if (!Array.isArray(existing)) {
      return reply.status(500).send({ type: 'database_error', message: 'Invalid students collection' });
    }
    const index = existing.findIndex((s) => String((s as { id: unknown }).id) === params.data.id);
    if (index < 0) {
      return reply.status(404).send({ type: 'not_found', message: 'Student not found' });
    }
    const next = [...existing];
    next[index] = { ...body.data, id: body.data.id ?? params.data.id };
    await persistCollection('students', next);
    return reply.send({ student: next[index] });
  });

  fastify.delete<{ Params: { id: string } }>('/:id', async (request, reply) => {
    const user = request.user as User;
    if (!canWriteCollection(user, 'students')) {
      return reply.status(403).send({ type: 'forbidden', message: 'Insufficient permissions' });
    }
    const params = studentIdParams.safeParse(request.params);
    if (!params.success) {
      return reply.status(400).send({ type: 'validation_error', message: 'Invalid student id' });
    }
    const existing = (await fetchCollection('students')) ?? [];
    if (!Array.isArray(existing)) {
      return reply.status(500).send({ type: 'database_error', message: 'Invalid students collection' });
    }
    const next = existing.filter((s) => String((s as { id: unknown }).id) !== params.data.id);
    if (next.length === existing.length) {
      return reply.status(404).send({ type: 'not_found', message: 'Student not found' });
    }
    await persistCollection('students', next);
    return reply.send({ success: true });
  });
}
