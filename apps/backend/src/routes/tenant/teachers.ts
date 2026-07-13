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
import { registerColumnPreferencesRoutes } from '../../lib/columnPreferencesRouter.js';

import {
  registerResourceRoutes,
  registerMetricsRoute,
  registerCountRoute,
  registerResolveRoute,
  registerWidgetAggregatesRoute,
  registerLinkedContactIdsRoute,
  registerPaginatedListRoute,
} from '../../lib/crudRouter.js';

/**
 * Server-first teacher resource routes (TanStack Query on FE).
 */
export default async function teachersRoutes(
  fastify: FastifyInstance,
  _options: FastifyPluginOptions,
): Promise<void> {
  fastify.addHook('preHandler', authenticateTenant);

  // --- Custom GET List (Paginated) ---
  registerPaginatedListRoute(fastify, {
    collection: 'teachers',
    schema: teachersListQuerySchema,
    defaultPageSize: TEACHERS_MODULE_CONTRACT.defaultPageSize,
    errorMessagePrefix: 'teachers',
    loadPageFn: (query) => loadTeachersPage(query),
  });


  // --- Custom GET Count ---
  registerCountRoute(fastify, {
    collection: 'teachers',
    loadAllFn: loadTeachers,
    errorMessagePrefix: 'teachers',
  });

  // --- Custom GET Metrics ---
  registerMetricsRoute(fastify, {
    collection: 'teachers',
    loadMetricsFn: async () => {
      const teachers = await loadTeachers();
      return computeTeachersCommandMetrics(teachers);
    },
    errorMessagePrefix: 'teacher',
  });

  // --- Custom POST Widget Aggregates ---
  registerWidgetAggregatesRoute(fastify, {
    collection: 'teachers',
    loadAggregatesFn: loadTeachersWidgetAggregates,
    errorMessagePrefix: 'teacher',
  });

  // --- Custom POST Resolve ---
  registerResolveRoute(fastify, {
    collection: 'teachers',
    loadByIdsFn: loadTeachersByIds,
    responseKey: 'teachers',
    errorMessagePrefix: 'teachers',
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

  // --- Custom GET Linked Contact IDs ---
  registerLinkedContactIdsRoute(fastify, {
    collection: 'teachers',
    loadLinkedContactIdsFn: loadTeacherLinkedContactIds,
    errorMessagePrefix: 'teachers',
  });

  registerColumnPreferencesRoutes(fastify, {
    collection: 'teachers',
    objectKey: TEACHERS_MODULE_CONTRACT.columnPreferencesObjectKey,
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
