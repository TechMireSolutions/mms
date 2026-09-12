import type { FastifyPluginAsync } from 'fastify';
import { withTenant } from '../../../db/tenant-context.js';
import { canDeleteCollection, canWriteCollection, canReadCollection } from '../../../services/rbacService.js';
import {
  TEACHERS_MODULE_MANIFEST,
  roleHasPermission,
  DEFAULT_TEACHERS_SETTINGS,
  isQueryFlagTrue,
  type Teacher,
  type User,
  teacherContract,
} from '@mms/shared';
import { initServer } from '@ts-rest/fastify';
import type { ContractRouteArgs, ContractRouteResponse } from '../../../lib/contractRouterTypes.js';
import { replyValidationError } from '../../../lib/zodRequest.js';
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
    list: async ({ query, request }: ContractRouteArgs<typeof teacherContract['list']>): Promise<ContractRouteResponse<typeof teacherContract['list']>> => {
      const user = request.user as User;
      if (!canReadCollection(user, 'teachers')) {
        return { status: 403 as const, body: { type: 'forbidden', message: 'Insufficient permissions' } };
      }
      const includeDeleted = isQueryFlagTrue(query?.includeDeleted);
      if (includeDeleted && !canDeleteCollection(user, 'teachers')) {
        return { status: 403 as const, body: { type: 'forbidden', message: 'Viewing deleted teachers requires delete permissions' } };
      }
      try {
        const result = await withTenant(String(request.tenant?.id), () => teacherUseCases.loadTeachersPage({ ...query, includeDeleted }), { readOnly: true });
        return {
          status: 200 as const,
          body: { ...result, teachers: await sanitizeTeachersForUser(result.teachers, user) },
        };
      } catch {
        return { status: 500 as const, body: { type: 'database_error', message: 'Failed to list teachers' } };
      }
    },

    get: async ({ params: { id }, query, request }: ContractRouteArgs<typeof teacherContract['get']>): Promise<ContractRouteResponse<typeof teacherContract['get']>> => {
      const user = request.user as User;
      if (!canReadCollection(user, 'teachers')) {
        return { status: 403 as const, body: { type: 'forbidden', message: 'Insufficient permissions' } };
      }
      const includeDeleted = isQueryFlagTrue(query?.includeDeleted);
      if (includeDeleted && !canDeleteCollection(user, 'teachers')) {
        return { status: 403 as const, body: { type: 'forbidden', message: 'Viewing deleted teachers requires delete permissions' } };
      }
      try {
        const item = await withTenant(String(request.tenant?.id), () => teacherUseCases.loadTeacherById(id, includeDeleted), { readOnly: true });
        if (!item || (!includeDeleted && (item as { deletedAt?: unknown }).deletedAt != null)) {
          return { status: 404 as const, body: { type: 'not_found', message: 'Teacher not found' } };
        }
        return { status: 200 as const, body: { teacher: await sanitizeOneTeacherForUser(item as Teacher, user) } };
      } catch {
        return { status: 500 as const, body: { type: 'database_error', message: 'Failed to load teacher' } };
      }
    },

    create: async ({ body, request }: ContractRouteArgs<typeof teacherContract['create']>): Promise<ContractRouteResponse<typeof teacherContract['create']>> => {
      const user = request.user as User;
      if (!canWriteCollection(user, 'teachers')) {
        return { status: 403 as const, body: { type: 'forbidden', message: 'Insufficient permissions' } };
      }
      const lang = (request.headers['accept-language'] as string) || 'en';
      const tenant = request.tenant?.id;
      if (tenant) {
        try {
          await validateTeacherDynamic(tenant, body as Record<string, unknown>, lang);
        } catch (error) {
          return {
            status: 400 as const,
            body: { type: 'validation_error', message: error instanceof Error ? error.message : String(error) },
          };
        }
      }
      try {
        const result = await withTenant(String(tenant), () => teacherUseCases.createTeacher(body), { readOnly: false });
        await auditTeacher(user, 'teacher.create', `Created teacher ${result.record.id}`, String(result.record.id));
        const teacher = await sanitizeOneTeacherForUser(result.record as Teacher, user);
        return result.restored
          ? {
              status: 200 as const,
              body: { success: true as const, teacher },
            }
          : {
              status: 201 as const,
              body: { success: true as const, teacher },
            };
      } catch {
        return { status: 500 as const, body: { type: 'database_error', message: 'Failed to create teacher' } };
      }
    },

    update: async ({ params: { id }, body, request }: ContractRouteArgs<typeof teacherContract['update']>): Promise<ContractRouteResponse<typeof teacherContract['update']>> => {
      const user = request.user as User;
      if (!canWriteCollection(user, 'teachers')) {
        return { status: 403 as const, body: { type: 'forbidden', message: 'Insufficient permissions' } };
      }
      const payload = { ...(body as Record<string, unknown>), id };
      const lang = (request.headers['accept-language'] as string) || 'en';
      const tenant = request.tenant?.id;
      if (tenant) {
        try {
          await validateTeacherDynamic(tenant, payload, lang);
        } catch (error) {
          return {
            status: 400 as const,
            body: { type: 'validation_error', message: error instanceof Error ? error.message : String(error) },
          };
        }
      }
      try {
        const updated = await withTenant(String(tenant), () => teacherUseCases.updateTeacherById(id, payload), { readOnly: false });
        if (!updated) return { status: 404 as const, body: { type: 'not_found', message: 'Teacher not found' } };
        await auditTeacher(user, 'teacher.update', `Updated teacher ${id}`, id);
        return { status: 200 as const, body: { success: true as const, teacher: await sanitizeOneTeacherForUser(updated as Teacher, user) } };
      } catch {
        return { status: 500 as const, body: { type: 'database_error', message: 'Failed to update teacher' } };
      }
    },

    delete: async ({ params: { id }, body, request }: ContractRouteArgs<typeof teacherContract['delete']>): Promise<ContractRouteResponse<typeof teacherContract['delete']>> => {
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
        return { status: 200 as const, body: { success: true as const } };
      } catch {
        return { status: 500 as const, body: { type: 'database_error', message: 'Failed to delete teacher' } };
      }
    },

    bulkStatus: async ({ body, request }: ContractRouteArgs<typeof teacherContract['bulkStatus']>): Promise<ContractRouteResponse<typeof teacherContract['bulkStatus']>> => {
      const user = request.user as User;
      if (!canWriteCollection(user, 'teachers')) {
        return { status: 403 as const, body: { type: 'forbidden', message: 'Insufficient permissions' } };
      }
      try {
        const result = await withTenant(String(request.tenant?.id), () =>
          teacherUseCases.bulkUpdateTeacherStatus(
            body.ids.map(String),
            body.status,
          ), { readOnly: false });
        await auditTeacher(
          user,
          'teacher.bulk_status',
          `Updated status to ${body.status} for ${result.succeeded} teacher(s); ${result.failed} failed`,
        );
        return { status: 200 as const, body: { success: true as const, ...result } };
      } catch {
        return { status: 500 as const, body: { type: 'database_error', message: 'Failed to bulk update teacher status' } };
      }
    },

    bulkSpecialization: async ({ body, request }: ContractRouteArgs<typeof teacherContract['bulkSpecialization']>): Promise<ContractRouteResponse<typeof teacherContract['bulkSpecialization']>> => {
      const user = request.user as User;
      if (!canWriteCollection(user, 'teachers')) {
        return { status: 403 as const, body: { type: 'forbidden', message: 'Insufficient permissions' } };
      }
      try {
        const result = await withTenant(String(request.tenant?.id), () =>
          teacherUseCases.bulkUpdateTeacherSpecialization(
            body.ids.map(String),
            body.specialization,
          ), { readOnly: false });
        await auditTeacher(
          user,
          'teacher.bulk_specialization',
          `Updated specialization to ${body.specialization} for ${result.succeeded} teacher(s); ${result.failed} failed`,
        );
        return { status: 200 as const, body: { success: true as const, ...result } };
      } catch {
        return { status: 500 as const, body: { type: 'database_error', message: 'Failed to bulk update teacher specialization' } };
      }
    },

    duplicateCheck: async ({ body, request }: ContractRouteArgs<typeof teacherContract['duplicateCheck']>): Promise<ContractRouteResponse<typeof teacherContract['duplicateCheck']>> => {
      const user = request.user as User;
      if (!canWriteCollection(user, 'teachers')) {
        return { status: 403 as const, body: { type: 'forbidden', message: 'Insufficient permissions' } };
      }
      try {
        const result = await withTenant(String(request.tenant?.id), () =>
          teacherUseCases.checkTeacherRegistrationDuplicate(body), { readOnly: false });
        return { status: 200 as const, body: result };
      } catch {
        return { status: 500 as const, body: { type: 'database_error', message: 'Failed to check duplicate' } };
      }
    },

    nextEmployeeId: async ({ query, request }: ContractRouteArgs<typeof teacherContract['nextEmployeeId']>): Promise<ContractRouteResponse<typeof teacherContract['nextEmployeeId']>> => {
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

    migrateEmployeeIds: async ({ request }: ContractRouteArgs<typeof teacherContract['migrateEmployeeIds']>): Promise<ContractRouteResponse<typeof teacherContract['migrateEmployeeIds']>> => {
      const user = request.user as User;
      if (!roleHasPermission(user.role, TEACHERS_MODULE_MANIFEST.permissions.setupWrite)) {
        return { status: 403 as const, body: { type: 'forbidden', message: 'Insufficient permissions' } };
      }
      try {
        const result = await withTenant(String(request.tenant?.id), () =>
          teacherUseCases.migrateTeachersMissingEmployeeIds(), { readOnly: false });
        return { status: 200 as const, body: { success: true as const, ...result } };
      } catch {
        return { status: 500 as const, body: { type: 'database_error', message: 'Failed to migrate employee IDs' } };
      }
    },
  } as unknown as Parameters<typeof s.router>[1]);

  await fastify.register(s.plugin(router), {
    requestValidationErrorHandler: (err, _request, reply) => {
      const zErr = err.body ?? err.query ?? err.pathParams ?? err.headers;
      const message = zErr instanceof Error ? zErr.message : err.message;
      void replyValidationError(reply, message);
    },
  });
};
