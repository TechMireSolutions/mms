import type { FastifyPluginAsync } from 'fastify';
import { type StudentsWidgetQuery, type User } from '@mms/shared';
import { studentUseCases } from '../../../students/use-cases/studentUseCases.js';
import {
  registerMetricsRoute,
  registerCountRoute,
  registerResolveRoute,
  registerWidgetAggregatesRoute,
  registerLinkedContactIdsRoute,
} from '../../../lib/crudRouter.js';
import { studentSoftDeleteRoutes } from './studentSoftDeleteRoutes.js';
import { sanitizeStudentsForUser } from './studentRouteHelpers.js';

/** Count, metrics, resolve, widget aggregates, and soft-delete routes. */
export const studentAggregateRoutes: FastifyPluginAsync = async (sub) => {
  registerCountRoute(sub, {
    collection: 'students',
    loadCountFn: () => studentUseCases.countStudents(),
    errorMessagePrefix: 'students',
  });

  registerMetricsRoute(sub, {
    collection: 'students',
    loadMetricsFn: () => studentUseCases.loadStudentsCommandMetrics(),
    errorMessagePrefix: 'student',
  });

  registerWidgetAggregatesRoute(sub, {
    collection: 'students',
    loadAggregatesFn: (queries) =>
      studentUseCases.loadStudentsWidgetAggregates(queries as unknown as StudentsWidgetQuery[]),
    errorMessagePrefix: 'student',
  });

  registerResolveRoute(sub, {
    collection: 'students',
    loadByIdsFn: async (ids, request) => {
      const students = await studentUseCases.loadStudentsByIds(ids);
      return sanitizeStudentsForUser(students, request.user as User);
    },
    responseKey: 'students',
    errorMessagePrefix: 'students',
  });

  registerLinkedContactIdsRoute(sub, {
    collection: 'students',
    loadLinkedContactIdsFn: (excludeId) => studentUseCases.loadStudentLinkedContactIds(excludeId),
    errorMessagePrefix: 'students',
  });

  await sub.register(studentSoftDeleteRoutes);
};
