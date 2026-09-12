import type { FastifyPluginAsync } from 'fastify';
import { type User } from '@mms/shared';
import { teacherUseCases } from '../../../teachers/use-cases/teacherUseCases.js';
import {
  registerMetricsRoute,
  registerCountRoute,
  registerWidgetAggregatesRoute,
  registerResolveRoute,
  registerLinkedContactIdsRoute,
  registerSingleRestoreRoute,
} from '../../../lib/crudRouter.js';
import { auditTeacher, sanitizeTeachersForUser } from './teacherRouteHelpers.js';

/** Count, metrics, resolve, widget aggregates, and inline restore routes. */
export const teacherAggregateRoutes: FastifyPluginAsync = async (sub) => {
  registerCountRoute(sub, {
    collection: 'teachers',
    loadCountFn: () => teacherUseCases.countTeachers(),
    errorMessagePrefix: 'teachers',
  });

  registerMetricsRoute(sub, {
    collection: 'teachers',
    loadMetricsFn: () => teacherUseCases.loadTeachersCommandMetrics(),
    errorMessagePrefix: 'teacher',
  });

  registerWidgetAggregatesRoute(sub, {
    collection: 'teachers',
    loadAggregatesFn: (queries) => teacherUseCases.loadTeachersWidgetAggregates(queries as unknown as Parameters<typeof teacherUseCases.loadTeachersWidgetAggregates>[0]),
    errorMessagePrefix: 'teacher',
  });

  registerResolveRoute(sub, {
    collection: 'teachers',
    loadByIdsFn: async (ids, request) => {
      const teachers = await teacherUseCases.loadTeachersByIds(ids);
      return sanitizeTeachersForUser(teachers, request.user as User);
    },
    responseKey: 'teachers',
    errorMessagePrefix: 'teachers',
  });

  registerLinkedContactIdsRoute(sub, {
    collection: 'teachers',
    loadLinkedContactIdsFn: (excludeId) => teacherUseCases.loadTeacherLinkedContactIds(excludeId),
    errorMessagePrefix: 'teachers',
  });

  registerSingleRestoreRoute(sub, {
    collection: 'teachers',
    nameSingular: 'teacher',
    restoreFn: (id, userId) => teacherUseCases.restoreTeacherById(id, userId),
    onAfterRestore: async (user, id) => {
      await auditTeacher(user, 'teacher.restore', `Restored teacher ${id}`, id);
    },
  });
};
