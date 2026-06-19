import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { authenticateTenant } from '../middleware/authenticate.js';
import { canReadCollection, canWriteCollection } from '../services/rbacService.js';
import {
  createAttendanceRecord,
  deleteAttendanceRecordById,
  loadAttendanceRecords,
  replaceAttendanceRecords,
  updateAttendanceRecordById,
} from '../services/attendanceService.js';
import type { User } from '@mms/shared';
import { sendForbidden } from '../lib/httpErrors.js';
import { resourceIdParamsSchema } from '../validation/commonSchemas.js';
import {
  attendanceBulkSchema,
  attendanceRecordSchema,
} from '../validation/attendanceSchemas.js';
import { parseRequest, replyValidationError } from '../lib/zodRequest.js';

const COLLECTION = 'attendance_records';

/**
 * Server-first attendance resource routes (TanStack Query on FE).
 */
export default async function attendanceRoutes(
  fastify: FastifyInstance,
  _options: FastifyPluginOptions,
): Promise<void> {
  fastify.addHook('preHandler', authenticateTenant);

  fastify.get('/', async (request, reply) => {
    const user = request.user as User;
    if (!canReadCollection(user, COLLECTION)) return sendForbidden(reply);
    try {
      return reply.send({ records: await loadAttendanceRecords() });
    } catch {
      return reply.status(500).send({ type: 'database_error', message: 'Failed to list attendance records' });
    }
  });

  fastify.put('/bulk', async (request, reply) => {
    const user = request.user as User;
    if (!canWriteCollection(user, COLLECTION)) return sendForbidden(reply);
    const parsed = parseRequest(attendanceBulkSchema, request.body);
    if (!parsed.ok) return replyValidationError(reply, parsed.message);
    try {
      const records = await replaceAttendanceRecords(parsed.data.records);
      return reply.send({ records });
    } catch {
      return reply.status(500).send({ type: 'database_error', message: 'Failed to replace attendance records' });
    }
  });

  fastify.post('/', async (request, reply) => {
    const user = request.user as User;
    if (!canWriteCollection(user, COLLECTION)) return sendForbidden(reply);
    const parsed = parseRequest(attendanceRecordSchema, request.body);
    if (!parsed.ok) return replyValidationError(reply, parsed.message);
    try {
      const record = await createAttendanceRecord(parsed.data);
      return reply.status(201).send({ record });
    } catch {
      return reply.status(500).send({ type: 'database_error', message: 'Failed to create attendance record' });
    }
  });

  fastify.put('/:id', async (request, reply) => {
    const user = request.user as User;
    if (!canWriteCollection(user, COLLECTION)) return sendForbidden(reply);
    const params = parseRequest(resourceIdParamsSchema, request.params);
    const body = parseRequest(attendanceRecordSchema, request.body);
    if (!params.ok) return replyValidationError(reply, params.message);
    if (!body.ok) return replyValidationError(reply, body.message);
    try {
      const updated = await updateAttendanceRecordById(params.data.id, {
        ...body.data,
        id: body.data.id ?? params.data.id,
      });
      if (!updated) {
        return reply.status(404).send({ type: 'not_found', message: 'Attendance record not found' });
      }
      return reply.send({ record: updated });
    } catch {
      return reply.status(500).send({ type: 'database_error', message: 'Failed to update attendance record' });
    }
  });

  fastify.delete<{ Params: { id: string } }>('/:id', async (request, reply) => {
    const user = request.user as User;
    if (!canWriteCollection(user, COLLECTION)) return sendForbidden(reply);
    const params = parseRequest(resourceIdParamsSchema, request.params);
    if (!params.ok) return replyValidationError(reply, params.message);
    try {
      const deleted = await deleteAttendanceRecordById(params.data.id);
      if (!deleted) {
        return reply.status(404).send({ type: 'not_found', message: 'Attendance record not found' });
      }
      return reply.send({ success: true });
    } catch {
      return reply.status(500).send({ type: 'database_error', message: 'Failed to delete attendance record' });
    }
  });
}
