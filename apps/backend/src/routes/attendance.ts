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
import { computeAttendanceCommandMetrics, ATTENDANCE_MODULE_CONTRACT } from '@mms/shared';
import { sendForbidden } from '../lib/httpErrors.js';
import { resourceIdParamsSchema } from '../validation/commonSchemas.js';
import { moduleColumnPrefsBodySchema } from '../validation/moduleColumnPrefsSchemas.js';
import {
  attendanceBulkSchema,
  attendanceRecordSchema,
} from '../validation/attendanceSchemas.js';
import { parseRequest, replyValidationError } from '../lib/zodRequest.js';
import {
  getUserColumnPrefsForModule,
  setUserColumnPrefsForModule,
} from '../services/userColumnPrefsService.js';

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

  fastify.get('/metrics', async (request, reply) => {
    const user = request.user as User;
    if (!canReadCollection(user, COLLECTION)) return sendForbidden(reply);
    const dateParam = (request.query as { date?: string }).date;
    const selectedDate =
      typeof dateParam === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateParam)
        ? dateParam
        : undefined;
    try {
      const records = await loadAttendanceRecords();
      return reply.send({
        metrics: computeAttendanceCommandMetrics(records, { selectedDate }),
      });
    } catch {
      return reply.status(500).send({ type: 'database_error', message: 'Failed to load attendance metrics' });
    }
  });

  fastify.get('/column-prefs', async (request, reply) => {
    const user = request.user as User;
    if (!canReadCollection(user, COLLECTION)) return sendForbidden(reply);
    try {
      const prefs = await getUserColumnPrefsForModule(
        ATTENDANCE_MODULE_CONTRACT.columnPrefsObjectKey,
        String(user.id),
      );
      return reply.send({ prefs });
    } catch {
      return reply.status(500).send({ type: 'database_error', message: 'Failed to load column preferences' });
    }
  });

  fastify.put('/column-prefs', async (request, reply) => {
    const user = request.user as User;
    if (!canReadCollection(user, COLLECTION)) return sendForbidden(reply);
    const parsed = parseRequest(moduleColumnPrefsBodySchema, request.body);
    if (!parsed.ok) return replyValidationError(reply, parsed.message);
    try {
      await setUserColumnPrefsForModule(
        ATTENDANCE_MODULE_CONTRACT.columnPrefsObjectKey,
        String(user.id),
        parsed.data.prefs,
      );
      return reply.send({ success: true, prefs: parsed.data.prefs });
    } catch {
      return reply.status(500).send({ type: 'database_error', message: 'Failed to save column preferences' });
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
