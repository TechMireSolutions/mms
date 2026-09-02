import type { FastifyPluginAsync } from 'fastify';
import { withTenant } from '../../../db/tenant-context.js';
import { canDeleteCollection, canWriteCollection, canReadCollection } from '../../../services/rbacService.js';
import {
  TEACHERS_MODULE_MANIFEST,
  roleHasPermission,
  DEFAULT_TEACHERS_SETTINGS,
  teacherRecordSchema,
  type Teacher,
  type User,
  teacherContract,
} from '@mms/shared';
import { initServer } from '@ts-rest/fastify';
import type { ContractRouteArgs } from '../../../lib/contractRouterTypes.js';
import { teacherUseCases } from '../../../teachers/use-cases/teacherUseCases.js';
import { validateTeacherDynamic } from '../../../services/teacherValidationService.js';
import {
  auditTeacher,
  sanitizeOneTeacherForUser,
  sanitizeTeachersForUser,
} from './teacherRouteHelpers.js';

const s = initServer();

/** Main teacher CRUD — @ts-rest contract router. */
export const teacherCrudRoutes: FastifyPluginAsync = async (fastify) => {
  const router = s.router(teacherContract, {
    list: async ({ query, request }: ContractRouteArgs<typeof teacherContract['list']>): Promise<unknown> => {
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
        const result = await withTenant(String(request.tenant?.id), () => teacherUseCases.loadTeachersPage({ ...rawQuery, ...query, includeDeleted } as Parameters<typeof teacherUseCases.loadTeachersPage>[0]), { readOnly: true });
        const page = result as { teachers: Teacher[] };
        return {
          status: 200 as const,
          body: { ...page, teachers: await sanitizeTeachersForUser(page.teachers, user) },
        };
      } catch {
        return { status: 500 as const, body: { type: 'database_error', message: 'Failed to list teachers' } };
      }
    },

    get: async ({ params: { id }, query, request }: ContractRouteArgs<typeof teacherContract['get']>): Promise<unknown> => {
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

    create: async ({ body, request }: ContractRouteArgs<typeof teacherContract['create']>): Promise<unknown> => {
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
        // (typed as User & { workspaceId? } because the legacy JWT payload may carry workspaceId;
        //  it is not on the shared User type)
        const result = await withTenant(String(tenant), () => teacherUseCases.createTeacher(
          { ...coreParsed, workspaceId: (user as User & { workspaceId?: string }).workspaceId } as never), { readOnly: false });
        await auditTeacher(user, 'teacher.create', `Created teacher ${result.record.id}`, String(result.record.id));
        return {
          status: (result.restored ? 200 : 201) as 200 | 201,
          body: { success: true, teacher: await sanitizeOneTeacherForUser(result.record as Teacher, user) },
        };
      } catch {
        return { status: 500 as const, body: { type: 'database_error', message: 'Failed to create teacher' } };
      }
    },

    update: async ({ params: { id }, body, request }: ContractRouteArgs<typeof teacherContract['update']>): Promise<unknown> => {
      const user = request.user as User;
      if (!canWriteCollection(user, 'teachers')) {
        return { status: 403 as const, body: { type: 'forbidden', message: 'Insufficient permissions' } };
      }
      let coreParsed: Record<string, unknown>;
      try {
        coreParsed = teacherRecordSchema.parse({ ...(body as Record<string, unknown>), id }) as unknown as Record<string, unknown>;
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

    delete: async ({ params: { id }, body, request }: ContractRouteArgs<typeof teacherContract['delete']>): Promise<unknown> => {
      const user = request.user as User;
      if (!canDeleteCollection(user, 'teachers')) {
        return { status: 403 as const, body: { type: 'forbidden', message: 'Insufficient permissions' } };
      }
      try {
        const reason = body?.deletionReason;
        const deleted = await withTenant(String(request.tenant?.id), () => teacherUseCases.deleteTeacherById(id, String(user.id), reason), { readOnly: false });
        if (!deleted) return { status: 404 as const, body: { type: 'not_found', message: 'Teacher not found' } };
        const reasonNote = reason?.trim() ? ` — ${reason.trim()}` : '';
        await auditTeacher(user, 'teacher.soft_delete', `Soft-deleted teacher ${id}${reasonNote}`, id);
        return { status: 200 as const, body: { success: true } };
      } catch {
        return { status: 500 as const, body: { type: 'database_error', message: 'Failed to delete teacher' } };
      }
    },

    bulkStatus: async ({ body, request }: ContractRouteArgs<typeof teacherContract['bulkStatus']>): Promise<unknown> => {
      const user = request.user as User;
      const { ids, status } = body as { ids: (string | number)[]; status: string };
      if (!canWriteCollection(user, 'teachers')) {
        return { status: 403 as const, body: { type: 'forbidden', message: 'Insufficient permissions' } };
      }
      try {
        const result = await withTenant(String(request.tenant?.id), () =>
          teacherUseCases.bulkUpdateTeacherStatus(
            ids.map(String),
            status,
          ), { readOnly: false });
        await auditTeacher(
          user,
          'teacher.bulk_status',
          `Updated status to ${status} for ${result.succeeded} teacher(s); ${result.failed} failed`,
        );
        return { status: 200 as const, body: { success: true, ...result } };
      } catch {
        return { status: 500 as const, body: { type: 'database_error', message: 'Failed to bulk update teacher status' } };
      }
    },

    bulkSpecialization: async ({ body, request }: ContractRouteArgs<typeof teacherContract['bulkSpecialization']>): Promise<unknown> => {
      const user = request.user as User;
      const { ids, specialization } = body as { ids: (string | number)[]; specialization: string };
      if (!canWriteCollection(user, 'teachers')) {
        return { status: 403 as const, body: { type: 'forbidden', message: 'Insufficient permissions' } };
      }
      try {
        const result = await withTenant(String(request.tenant?.id), () =>
          teacherUseCases.bulkUpdateTeacherSpecialization(
            ids.map(String),
            specialization,
          ), { readOnly: false });
        await auditTeacher(
          user,
          'teacher.bulk_specialization',
          `Updated specialization to ${specialization} for ${result.succeeded} teacher(s); ${result.failed} failed`,
        );
        return { status: 200 as const, body: { success: true, ...result } };
      } catch {
        return { status: 500 as const, body: { type: 'database_error', message: 'Failed to bulk update teacher specialization' } };
      }
    },

    duplicateCheck: async ({ body, request }: ContractRouteArgs<typeof teacherContract['duplicateCheck']>): Promise<unknown> => {
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

    nextEmployeeId: async ({ query, request }: ContractRouteArgs<typeof teacherContract['nextEmployeeId']>): Promise<unknown> => {
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

    migrateEmployeeIds: async ({ request }: ContractRouteArgs<typeof teacherContract['migrateEmployeeIds']>): Promise<unknown> => {
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
  } as unknown as Parameters<typeof s.router>[1]);

  await fastify.register(s.plugin(router));
};
