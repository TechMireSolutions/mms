import type { FastifyPluginAsync } from 'fastify';
import { withTenant } from '../../../db/tenant-context.js';
import { type User } from '@mms/shared';
import { canDeleteCollection } from '../../../services/rbacService.js';
import { teacherUseCases } from '../../../teachers/use-cases/teacherUseCases.js';
import {
  registerMetricsRoute,
  registerCountRoute,
  registerWidgetAggregatesRoute,
  registerResolveRoute,
  registerLinkedContactIdsRoute,
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
    loadAggregatesFn: teacherUseCases.loadTeachersWidgetAggregates as unknown as (queries: unknown[]) => Promise<unknown>,
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

  sub.post<{ Params: { id: string } }>('/:id/restore', async (request, reply) => {
    const user = request.user as User;
    if (!canDeleteCollection(user, 'teachers')) {
      return reply.status(403).send({ type: 'forbidden', message: 'Insufficient permissions' });
    }
    const { id } = request.params;
    try {
      const restored = await withTenant(String(request.tenant?.id), () => teacherUseCases.restoreTeacherById(id), { readOnly: false });
      if (!restored) {
        return reply.status(404).send({ type: 'not_found', message: 'Teacher not found or not deleted' });
      }
      await auditTeacher(user, 'teacher.restore', `Restored teacher ${id}`, id);
      return reply.send({ success: true });
    } catch {
      return reply.status(500).send({ type: 'database_error', message: 'Failed to restore teacher' });
    }
  });
};
