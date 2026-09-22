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
    collection: 'faculty',
    loadCountFn: () => facultyUseCases.countTeachers(),
    errorMessagePrefix: 'faculty',
  });

  registerMetricsRoute(sub, {
    collection: 'faculty',
    loadMetricsFn: () => facultyUseCases.loadTeachersCommandMetrics(),
    errorMessagePrefix: 'faculty',
  });

  registerWidgetAggregatesRoute(sub, {
    collection: 'faculty',
    loadAggregatesFn: (queries) => facultyUseCases.loadTeachersWidgetAggregates(queries),
    errorMessagePrefix: 'faculty',
  });

  registerResolveRoute(sub, {
    collection: 'faculty',
    loadByIdsFn: async (ids, request) => {
      const teachers = await facultyUseCases.loadTeachersByIds(ids);
      return sanitizeFacultyForUser(teachers, request.user as User);
    },
    responseKey: 'faculty',
    aliases: ['teachers'],
    errorMessagePrefix: 'faculty',
  });

  registerLinkedContactIdsRoute(sub, {
    collection: 'faculty',
    loadLinkedContactIdsFn: (excludeId) => facultyUseCases.loadTeacherLinkedContactIds(excludeId),
    errorMessagePrefix: 'faculty',
  });

  registerSingleRestoreRoute(sub, {
    collection: 'faculty',
    nameSingular: 'faculty',
    restoreFn: (id, userId) => facultyUseCases.restoreTeacherById(id, userId),
    onAfterRestore: async (user, id) => {
      await auditFaculty(user, 'faculty.restore', `Restored faculty member ${id}`, id);
    },
  });
};

export const teacherAggregateRoutes = facultyAggregateRoutes;
