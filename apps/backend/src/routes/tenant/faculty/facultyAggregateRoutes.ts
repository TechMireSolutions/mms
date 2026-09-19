import type { FastifyPluginAsync } from 'fastify';
import { type User } from '@mms/shared';
import { facultyUseCases } from '../../../faculty/use-cases/facultyUseCases.js';
import {
  registerMetricsRoute,
  registerCountRoute,
  registerWidgetAggregatesRoute,
  registerResolveRoute,
  registerLinkedContactIdsRoute,
  registerSingleRestoreRoute,
} from '../../../lib/crudRouter.js';
import { auditFaculty, sanitizeFacultyForUser } from './facultyRouteHelpers.js';

/** Count, metrics, resolve, widget aggregates, and inline restore routes. */
export const facultyAggregateRoutes: FastifyPluginAsync = async (sub) => {
  registerCountRoute(sub, {
    collection: 'teachers',
    loadCountFn: () => facultyUseCases.countTeachers(),
    errorMessagePrefix: 'teachers',
  });

  registerMetricsRoute(sub, {
    collection: 'teachers',
    loadMetricsFn: () => facultyUseCases.loadTeachersCommandMetrics(),
    errorMessagePrefix: 'teacher',
  });

  registerWidgetAggregatesRoute(sub, {
    collection: 'teachers',
    loadAggregatesFn: (queries) => facultyUseCases.loadTeachersWidgetAggregates(queries),
    errorMessagePrefix: 'teacher',
  });

  registerResolveRoute(sub, {
    collection: 'teachers',
    loadByIdsFn: async (ids, request) => {
      const teachers = await facultyUseCases.loadTeachersByIds(ids);
      return sanitizeFacultyForUser(teachers, request.user as User);
    },
    responseKey: 'teachers',
    errorMessagePrefix: 'teachers',
  });

  registerLinkedContactIdsRoute(sub, {
    collection: 'teachers',
    loadLinkedContactIdsFn: (excludeId) => facultyUseCases.loadTeacherLinkedContactIds(excludeId),
    errorMessagePrefix: 'teachers',
  });

  registerSingleRestoreRoute(sub, {
    collection: 'teachers',
    nameSingular: 'teacher',
    restoreFn: (id, userId) => facultyUseCases.restoreTeacherById(id, userId),
    onAfterRestore: async (user, id) => {
      await auditFaculty(user, 'teacher.restore', `Restored teacher ${id}`, id);
    },
  });
};

export const teacherAggregateRoutes = facultyAggregateRoutes;
