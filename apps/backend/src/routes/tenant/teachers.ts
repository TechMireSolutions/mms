import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { authenticateTenant } from '../../middleware/authenticate.js';
import { requireTenantModule } from '../../middleware/requireTenantModule.js';
import { canDeleteCollection, canWriteCollection, canReadCollection } from '../../services/rbacService.js';
import { teacherUseCases } from '../../teachers/use-cases/teacherUseCases.js';
import {
  TEACHERS_MODULE_MANIFEST,
  roleHasPermission,
  DEFAULT_TEACHERS_SETTINGS,
  teacherRecordSchema,
  type Teacher,
  type User,
  rootContract,
} from '@mms/shared';
import { initServer } from '@ts-rest/fastify';
import { withTenant } from '../../db/tenant-context.js';
import { teacherSetupConfigRoutes } from './teachers/teacherSetupConfigRoutes.js';
import { teacherLookupRoutes } from './teachers/teacherLookupRoutes.js';
import { teacherExportRoutes } from './teachers/teacherExportRoutes.js';
import { teacherSoftDeleteRoutes } from './teachers/teacherSoftDeleteRoutes.js';
import { validateTeacherDynamic } from '../../services/teacherValidationService.js';
import {
  auditTeacher,
  sanitizeOneTeacherForUser,
  sanitizeTeachersForUser,
} from './teachers/teacherRouteHelpers.js';
import {
  registerMetricsRoute,
  registerCountRoute,
  registerWidgetAggregatesRoute,
  registerResolveRoute,
  registerLinkedContactIdsRoute,
} from '../../lib/crudRouter.js';


const s = initServer();

/**
 * Server-first teacher resource routes (TanStack Query on FE).
 * Main CRUD migrated to @ts-rest contract router (Phase 3).
 */
export default async function teachersRoutes(
  fastify: FastifyInstance,
  _options: FastifyPluginOptions,
): Promise<void> {
  fastify.addHook('preHandler', authenticateTenant);
  fastify.addHook('preHandler', requireTenantModule('teachers'));

  await fastify.register(teacherSetupConfigRoutes, { prefix: '/api/teachers' });
  await fastify.register(teacherLookupRoutes, { prefix: '/api/teachers' });
  await fastify.register(teacherExportRoutes, { prefix: '/api/teachers' });
  await fastify.register(teacherSoftDeleteRoutes, { prefix: '/api/teachers' });

  // Extended non-CRUD routes (metrics, count, widget aggregates, resolve, column prefs)
  await fastify.register(
    async (sub) => {
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
          const restored = await withTenant(String((request as any).tenant?.id), () => teacherUseCases.restoreTeacherById(id), { readOnly: false });
          if (!restored) {
            return reply.status(404).send({ type: 'not_found', message: 'Teacher not found or not deleted' });
          }
          await auditTeacher(user, 'teacher.restore', `Restored teacher ${id}`, id);
          return reply.send({ success: true });
        } catch {
          return reply.status(500).send({ type: 'database_error', message: 'Failed to restore teacher' });
        }
      });
    },
    { prefix: '/api/teachers' },
  );

  // Main CRUD — @ts-rest contract router
  const router = s.router(rootContract.teachers, {
    list: async ({ query, request }: any) => {
      const user = request.user as User;
      if (!canReadCollection(user, 'teachers')) {
        return { status: 403 as const, body: { type: 'forbidden', message: 'Insufficient permissions' } };
      }
      const includeDeleted = query.includeDeleted === 'true' || query.includeDeleted === true;
      if (includeDeleted && !canDeleteCollection(user, 'teachers')) {
        return { status: 403 as const, body: { type: 'forbidden', message: 'Viewing deleted teachers requires delete permissions' } };
      }
      try {
        const rawQuery = (request.query || query) as Record<string, unknown>;
        const result = await withTenant(String(request.tenant?.id), () => teacherUseCases.loadTeachersPage({ ...rawQuery, ...query, includeDeleted }), { readOnly: true });
        const page = result as { teachers: Teacher[] };
        return {
          status: 200 as const,
          body: { ...page, teachers: await sanitizeTeachersForUser(page.teachers, user) },
        };
      } catch {
        return { status: 500 as const, body: { type: 'database_error', message: 'Failed to list teachers' } };
      }
    },

    get: async ({ params: { id }, query, request }: any) => {
      const user = request.user as User;
      if (!canReadCollection(user, 'teachers')) {
        return { status: 403 as const, body: { type: 'forbidden', message: 'Insufficient permissions' } };
      }
      const includeDeleted = query?.includeDeleted === 'true' || query?.includeDeleted === true;
      if (includeDeleted && !canDeleteCollection(user, 'teachers')) {
        return { status: 403 as const, body: { type: 'forbidden', message: 'Viewing deleted teachers requires delete permissions' } };
      }
      try {
        const item = await withTenant(String(request.tenant?.id), () => teacherUseCases.loadTeacherById(id, includeDeleted), { readOnly: true });
        if (!item) return { status: 404 as const, body: { type: 'not_found', message: 'Teacher not found' } };
        return { status: 200 as const, body: { teacher: await sanitizeOneTeacherForUser(item as Teacher, user) } };
      } catch {
        return { status: 500 as const, body: { type: 'database_error', message: 'Failed to load teacher' } };
      }
    },

    create: async ({ body, request }: any) => {
      const user = request.user as User;
      if (!canWriteCollection(user, 'teachers')) {
        return { status: 403 as const, body: { type: 'forbidden', message: 'Insufficient permissions' } };
      }
      let coreParsed: Record<string, unknown>;
      try {
        coreParsed = teacherRecordSchema.parse(body) as unknown as Record<string, unknown>;
      } catch (err) {
        return {
          status: 400 as const,
          body: { type: 'validation_error', message: err instanceof Error ? err.message : String(err) },
        };
      }
      const lang = (request.headers['accept-language'] as string) || 'en';
      const tenant = request.tenant?.id;
      if (tenant) {
        try {
          await validateTeacherDynamic(tenant, coreParsed, lang);
        } catch (error) {
          return {
            status: 400 as const,
            body: { type: 'validation_error', message: error instanceof Error ? error.message : String(error) },
          };
        }
      }
      try {
        const result = await withTenant(String(tenant), () => teacherUseCases.createTeacher({ ...coreParsed, workspaceId: (user as any).workspaceId } as never), { readOnly: false });
        await auditTeacher(user, 'teacher.create', `Created teacher ${result.record.id}`, String(result.record.id));
        return {
          status: (result.restored ? 200 : 201) as any,
          body: { success: true, teacher: await sanitizeOneTeacherForUser(result.record as Teacher, user) },
        };
      } catch {
        return { status: 500 as const, body: { type: 'database_error', message: 'Failed to create teacher' } };
      }
    },

    update: async ({ params: { id }, body, request }: any) => {
      const user = request.user as User;
      if (!canWriteCollection(user, 'teachers')) {
        return { status: 403 as const, body: { type: 'forbidden', message: 'Insufficient permissions' } };
      }
      let coreParsed: Record<string, unknown>;
      try {
        coreParsed = teacherRecordSchema.parse({ ...body, id }) as unknown as Record<string, unknown>;
      } catch (err) {
        return {
          status: 400 as const,
          body: { type: 'validation_error', message: err instanceof Error ? err.message : String(err) },
        };
      }
      const lang = (request.headers['accept-language'] as string) || 'en';
      const tenant = request.tenant?.id;
      if (tenant) {
        try {
          await validateTeacherDynamic(tenant, coreParsed, lang);
        } catch (error) {
          return {
            status: 400 as const,
            body: { type: 'validation_error', message: error instanceof Error ? error.message : String(error) },
          };
        }
      }
      try {
        const updated = await withTenant(String(tenant), () => teacherUseCases.updateTeacherById(id, { ...coreParsed, id } as never), { readOnly: false });
        if (!updated) return { status: 404 as const, body: { type: 'not_found', message: 'Teacher not found' } };
        await auditTeacher(user, 'teacher.update', `Updated teacher ${id}`, id);
        return { status: 200 as const, body: { success: true, teacher: await sanitizeOneTeacherForUser(updated as Teacher, user) } };
      } catch {
        return { status: 500 as const, body: { type: 'database_error', message: 'Failed to update teacher' } };
      }
    },

    delete: async ({ params: { id }, body, request }: any) => {
      const user = request.user as User;
      if (!canDeleteCollection(user, 'teachers')) {
        return { status: 403 as const, body: { type: 'forbidden', message: 'Insufficient permissions' } };
      }
      try {
        const reason = (body as any)?.deletionReason;
        const deleted = await withTenant(String(request.tenant?.id), () => teacherUseCases.deleteTeacherById(id, String(user.id), reason), { readOnly: false });
        if (!deleted) return { status: 404 as const, body: { type: 'not_found', message: 'Teacher not found' } };
        const reasonNote = reason?.trim() ? ` — ${reason.trim()}` : '';
        await auditTeacher(user, 'teacher.soft_delete', `Soft-deleted teacher ${id}${reasonNote}`, id);
        return { status: 200 as const, body: { success: true } };
      } catch {
        return { status: 500 as const, body: { type: 'database_error', message: 'Failed to delete teacher' } };
      }
    },

    bulkStatus: async ({ body, request }: any) => {
      const user = request.user as User;
      if (!canWriteCollection(user, 'teachers')) {
        return { status: 403 as const, body: { type: 'forbidden', message: 'Insufficient permissions' } };
      }
      try {
        const result = await withTenant(String(request.tenant?.id), () =>
          teacherUseCases.bulkUpdateTeacherStatus(
            (body as any).ids.map(String),
            (body as any).status,
          ), { readOnly: false });
        await auditTeacher(
          user,
          'teacher.bulk_status',
          `Updated status to ${(body as any).status} for ${result.succeeded} teacher(s); ${result.failed} failed`,
        );
        return { status: 200 as const, body: { success: true, ...result } };
      } catch {
        return { status: 500 as const, body: { type: 'database_error', message: 'Failed to bulk update teacher status' } };
      }
    },

    bulkSpecialization: async ({ body, request }: any) => {
      const user = request.user as User;
      if (!canWriteCollection(user, 'teachers')) {
        return { status: 403 as const, body: { type: 'forbidden', message: 'Insufficient permissions' } };
      }
      try {
        const result = await withTenant(String(request.tenant?.id), () =>
          teacherUseCases.bulkUpdateTeacherSpecialization(
            (body as any).ids.map(String),
            (body as any).specialization,
          ), { readOnly: false });
        await auditTeacher(
          user,
          'teacher.bulk_specialization',
          `Updated specialization to ${(body as any).specialization} for ${result.succeeded} teacher(s); ${result.failed} failed`,
        );
        return { status: 200 as const, body: { success: true, ...result } };
      } catch {
        return { status: 500 as const, body: { type: 'database_error', message: 'Failed to bulk update teacher specialization' } };
      }
    },

    duplicateCheck: async ({ body, request }: any) => {
      const user = request.user as User;
      if (!canWriteCollection(user, 'teachers')) {
        return { status: 403 as const, body: { type: 'forbidden', message: 'Insufficient permissions' } };
      }
      try {
        const result = await withTenant(String(request.tenant?.id), () =>
          teacherUseCases.checkTeacherRegistrationDuplicate(body as never), { readOnly: false });
        return { status: 200 as const, body: result };
      } catch {
        return { status: 500 as const, body: { type: 'database_error', message: 'Failed to check duplicate' } };
      }
    },

    nextEmployeeId: async ({ query, request }: any) => {
      const user = request.user as User;
      if (!canReadCollection(user, 'teachers')) {
        return { status: 403 as const, body: { type: 'forbidden', message: 'Insufficient permissions' } };
      }
      try {
        const employeeId = await withTenant(String(request.tenant?.id), () =>
          teacherUseCases.computeNextTeacherEmployeeIdForSettings({
            idPrefix: query.prefix ?? DEFAULT_TEACHERS_SETTINGS.idPrefix,
          }), { readOnly: true });
        return { status: 200 as const, body: { employeeId } };
      } catch {
        return { status: 500 as const, body: { type: 'database_error', message: 'Failed to compute next employee ID' } };
      }
    },

    migrateEmployeeIds: async ({ request }: any) => {
      const user = request.user as User;
      if (!roleHasPermission(user.role, TEACHERS_MODULE_MANIFEST.permissions.setupWrite)) {
        return { status: 403 as const, body: { type: 'forbidden', message: 'Insufficient permissions' } };
      }
      try {
        const result = await withTenant(String(request.tenant?.id), () =>
          teacherUseCases.migrateTeachersMissingEmployeeIds(), { readOnly: false });
        return { status: 200 as const, body: { success: true, ...result } };
      } catch {
        return { status: 500 as const, body: { type: 'database_error', message: 'Failed to migrate employee IDs' } };
      }
    },
  } as any);

  await fastify.register(s.plugin(router));
}
