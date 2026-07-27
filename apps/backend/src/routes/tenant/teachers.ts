import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { authenticateTenant } from '../../middleware/authenticate.js';
import { canDeleteCollection, canReadCollection, canWriteCollection } from '../../services/rbacService.js';
import {
  createTeacher,
  deleteTeacherById,
  restoreTeacherById,
  bulkSoftDeleteTeachers,
  bulkRestoreTeachers,
  bulkUpdateTeacherStatus,
  loadTeachers,
  loadTeachersPage,
  loadTeachersByIds,
  loadTeacherById,
  loadTeacherLinkedContactIds,
  computeNextTeacherEmployeeIdForSettings,
  loadTeachersWidgetAggregates,
  updateTeacherById,
} from '../../services/teacherService.js';
import type { User } from '@mms/shared';
import { TEACHERS_MODULE_CONTRACT, computeTeachersCommandMetrics } from '@mms/shared';
import { sendDatabaseError, sendForbidden } from '../../lib/httpErrors.js';
import {
  teacherRecordSchema,
  teachersListQuerySchema,
  teachersNextEmployeeIdQuerySchema,
  teachersBulkIdsSchema,
  teachersBulkStatusSchema,
} from '../../validation/teacherSchemas.js';
import { parseRequest, replyValidationError } from '../../lib/zodRequest.js';

import { registerStandardTenantRoutes } from '../../lib/crudRouter.js';

/**
 * Server-first teacher resource routes (TanStack Query on FE).
 */
export default async function teachersRoutes(
  fastify: FastifyInstance,
  _options: FastifyPluginOptions,
): Promise<void> {
  fastify.addHook('preHandler', authenticateTenant);

  // --- Register Standard Tenant Routes ---
  registerStandardTenantRoutes(fastify, {
    collection: 'teachers',
    schema: teacherRecordSchema,
    listQuerySchema: teachersListQuerySchema,
    defaultPageSize: TEACHERS_MODULE_CONTRACT.defaultPageSize,
    errorMessagePrefix: 'teachers',
    nameSingular: 'teacher',
    namePlural: 'teachers',
    loadPageFn: (query) => loadTeachersPage(query),
    loadAllFn: loadTeachers,
    loadByIdFn: loadTeacherById,
    createFn: createTeacher,
    updateFn: updateTeacherById,
    deleteFn: deleteTeacherById,
    restoreFn: restoreTeacherById,
    computeMetricsFn: (teachers) => computeTeachersCommandMetrics(teachers),
    loadWidgetAggregatesFn: loadTeachersWidgetAggregates as unknown as (queries: unknown[]) => Promise<unknown>,
    loadByIdsFn: loadTeachersByIds,
    loadLinkedContactIdsFn: loadTeacherLinkedContactIds,
    columnPreferencesObjectKey: TEACHERS_MODULE_CONTRACT.columnPreferencesObjectKey,
  });

  fastify.post('/bulk-delete', async (request, reply) => {
    const user = request.user as User;
    if (!canDeleteCollection(user, 'teachers')) return sendForbidden(reply);
    const parsed = parseRequest(teachersBulkIdsSchema, request.body);
    if (!parsed.ok) return replyValidationError(reply, parsed.message);
    try {
      const result = await bulkSoftDeleteTeachers(
        parsed.data.ids.map(String),
        String(user.id),
        parsed.data.deletionReason,
      );
      return reply.send({ success: true, ...result });
    } catch {
      return sendDatabaseError(reply, 'Failed to bulk delete teachers');
    }
  });

  fastify.post('/bulk-restore', async (request, reply) => {
    const user = request.user as User;
    if (!canDeleteCollection(user, 'teachers')) return sendForbidden(reply);
    const parsed = parseRequest(teachersBulkIdsSchema, request.body);
    if (!parsed.ok) return replyValidationError(reply, parsed.message);
    try {
      const result = await bulkRestoreTeachers(parsed.data.ids.map(String));
      return reply.send({ success: true, ...result });
    } catch {
      return sendDatabaseError(reply, 'Failed to bulk restore teachers');
    }
  });

  fastify.post('/bulk-status', async (request, reply) => {
    const user = request.user as User;
    if (!canWriteCollection(user, 'teachers')) return sendForbidden(reply);
    const parsed = parseRequest(teachersBulkStatusSchema, request.body);
    if (!parsed.ok) return replyValidationError(reply, parsed.message);
    try {
      const result = await bulkUpdateTeacherStatus(parsed.data.ids.map(String), parsed.data.status);
      return reply.send({ success: true, ...result });
    } catch {
      return sendDatabaseError(reply, 'Failed to bulk update teacher status');
    }
  });

  // --- Custom GET Next Employee ID ---
  fastify.get('/next-employee-id', async (request, reply) => {
    const user = request.user as User;
    if (!canReadCollection(user, 'teachers')) return sendForbidden(reply);
    const parsed = parseRequest(teachersNextEmployeeIdQuerySchema, request.query);
    if (!parsed.ok) return replyValidationError(reply, parsed.message);
    const employeeId = await computeNextTeacherEmployeeIdForSettings({
      idPrefix: parsed.data.prefix ?? 'TCH',
    });
    return reply.send({ employeeId });
  });
}
