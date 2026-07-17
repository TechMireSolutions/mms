import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { authenticateTenant } from '../../middleware/authenticate.js';
import { canReadCollection } from '../../services/rbacService.js';
import {
  createTeacher,
  deleteTeacherById,
  restoreTeacherById,
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
import { sendForbidden } from '../../lib/httpErrors.js';
import { teacherRecordSchema, teachersListQuerySchema, teachersNextEmployeeIdQuerySchema } from '../../validation/teacherSchemas.js';
import { parseRequest, replyValidationError } from '../../lib/zodRequest.js';

import {
  registerResourceRoutes,
  registerStandardExtendedRoutes,
} from '../../lib/crudRouter.js';

/**
 * Server-first teacher resource routes (TanStack Query on FE).
 */
export default async function teachersRoutes(
  fastify: FastifyInstance,
  _options: FastifyPluginOptions,
): Promise<void> {
  fastify.addHook('preHandler', authenticateTenant);

  // --- Register Standard Extended Routes ---
  registerStandardExtendedRoutes(fastify, {
    collection: 'teachers',
    listQuerySchema: teachersListQuerySchema,
    defaultPageSize: TEACHERS_MODULE_CONTRACT.defaultPageSize,
    errorMessagePrefix: 'teachers',
    nameSingular: 'teacher',
    loadPageFn: (query) => loadTeachersPage(query),
    loadAllFn: loadTeachers,
    computeMetricsFn: (teachers) => computeTeachersCommandMetrics(teachers),
    loadWidgetAggregatesFn: loadTeachersWidgetAggregates,
    loadByIdsFn: loadTeachersByIds,
    loadLinkedContactIdsFn: loadTeacherLinkedContactIds,
    columnPreferencesObjectKey: TEACHERS_MODULE_CONTRACT.columnPreferencesObjectKey,
  });

  // --- Custom GET Next Employee ID ---
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


  // --- Resource Mutations ---
  registerResourceRoutes(fastify, {
    customGetRoute: true,
    collection: 'teachers',
    schema: teacherRecordSchema,
    loadByIdFn: loadTeacherById,
    createFn: createTeacher,
    updateFn: updateTeacherById,
    deleteFn: deleteTeacherById,
    restoreFn: restoreTeacherById,
    nameSingular: 'teacher',
    namePlural: 'teachers',
  });
}
