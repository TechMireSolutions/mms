import type { FastifyPluginAsync } from 'fastify';
import { withTenant } from '../../../db/tenant-context.js';
import { canDeleteCollection, canWriteCollection, canReadCollection } from '../../../services/rbacService.js';
import {
  FACULTY_MODULE_MANIFEST,
  roleHasPermission,
  isQueryFlagTrue,
  type Teacher,
  type User,
  facultyContract,
} from '@mms/shared';
import { initServer, type RouterImplementation } from '@ts-rest/fastify';
import type { ContractRouteArgs, ContractRouteResponse } from '../../../lib/contractRouterTypes.js';
import { replyValidationError } from '../../../lib/zodRequest.js';
import { facultyUseCases } from '../../../faculty/use-cases/facultyUseCases.js';
import { validateFacultyDynamic } from '../../../services/facultyValidationService.js';
import {
  auditFaculty,
  sanitizeOneFacultyForUser,
  sanitizeFacultyForUser,
} from './facultyRouteHelpers.js';

const s = initServer();

/** Main faculty CRUD — @ts-rest contract router. */
export const facultyCrudRoutes: FastifyPluginAsync = async (fastify) => {
  const router = s.router(facultyContract, {
    list: async ({ query, request }: ContractRouteArgs<typeof facultyContract['list']>): Promise<ContractRouteResponse<typeof facultyContract['list']>> => {
      const user = request.user as User;
      if (!canReadCollection(user, 'faculty')) {
        return { status: 403 as const, body: { type: 'forbidden', message: 'Insufficient permissions' } };
      }
      const includeDeleted = isQueryFlagTrue(query?.includeDeleted);
      const skipCount = isQueryFlagTrue(query?.skipCount);
      if (includeDeleted && !canDeleteCollection(user, 'faculty')) {
        return { status: 403 as const, body: { type: 'forbidden', message: 'Viewing deleted faculty requires delete permissions' } };
      }
      try {
        const result = await withTenant(String(request.tenant?.id), () => facultyUseCases.loadTeachersPage({ ...query, includeDeleted, skipCount }), { readOnly: true });
        const sanitized = await sanitizeFacultyForUser(result.teachers, user);
        return {
          status: 200 as const,
          body: {
            ...result,
            faculty: sanitized,
            teachers: sanitized,
          },
        };
      } catch {
        return { status: 500 as const, body: { type: 'database_error', message: 'Failed to list faculty' } };
      }
    },

    get: async ({ params: { id }, query, request }: ContractRouteArgs<typeof facultyContract['get']>): Promise<ContractRouteResponse<typeof facultyContract['get']>> => {
      const user = request.user as User;
      if (!canReadCollection(user, 'faculty')) {
        return { status: 403 as const, body: { type: 'forbidden', message: 'Insufficient permissions' } };
      }
      const includeDeleted = isQueryFlagTrue(query?.includeDeleted);
      if (includeDeleted && !canDeleteCollection(user, 'faculty')) {
        return { status: 403 as const, body: { type: 'forbidden', message: 'Viewing deleted faculty requires delete permissions' } };
      }
      try {
        const item = await withTenant(String(request.tenant?.id), () => facultyUseCases.loadTeacherById(id, includeDeleted), { readOnly: true });
        if (!item || (!includeDeleted && (item as { deletedAt?: unknown }).deletedAt != null)) {
          return { status: 404 as const, body: { type: 'not_found', message: 'Faculty member not found' } };
        }
        const sanitized = await sanitizeOneFacultyForUser(item as Teacher, user);
        return {
          status: 200 as const,
          body: {
            faculty: sanitized,
            facultyMember: sanitized,
            teacher: sanitized,
          },
        };
      } catch {
        return { status: 500 as const, body: { type: 'database_error', message: 'Failed to load faculty member' } };
      }
    },

    create: async ({ body, request }: ContractRouteArgs<typeof facultyContract['create']>): Promise<ContractRouteResponse<typeof facultyContract['create']>> => {
      const user = request.user as User;
      if (!canWriteCollection(user, 'faculty')) {
        return { status: 403 as const, body: { type: 'forbidden', message: 'Insufficient permissions' } };
      }
      const lang = (request.headers['accept-language'] as string) || 'en';
      const tenant = request.tenant?.id;
      if (tenant) {
        try {
          await validateFacultyDynamic(tenant, body as Record<string, unknown>, lang);
        } catch (error) {
          return {
            status: 400 as const,
            body: { type: 'validation_error', message: error instanceof Error ? error.message : String(error) },
          };
        }
      }
      try {
        const result = await withTenant(
          String(tenant),
          () => facultyUseCases.createTeacher(body, {
            canRestore: canDeleteCollection(user, 'faculty'),
          }),
          { readOnly: false },
        );
        await auditFaculty(user, 'faculty.create', `Created faculty member ${result.record.id}`, String(result.record.id));
        const sanitized = await sanitizeOneFacultyForUser(result.record as Teacher, user);
        return result.restored
          ? {
              status: 200 as const,
              body: { success: true as const, faculty: sanitized, teacher: sanitized },
            }
          : {
              status: 201 as const,
              body: { success: true as const, faculty: sanitized, teacher: sanitized },
            };
      } catch (error: unknown) {
        request.log.error({ err: error }, 'Failed to create faculty member');
        if ((error as { statusCode?: number }).statusCode === 403) {
          return { status: 403 as const, body: { type: 'forbidden', message: error instanceof Error ? error.message : 'Forbidden' } };
        }
        return { status: 500 as const, body: { type: 'database_error', message: 'Failed to create faculty member' } };
      }
    },

    update: async ({ params: { id }, body, request }: ContractRouteArgs<typeof facultyContract['update']>): Promise<ContractRouteResponse<typeof facultyContract['update']>> => {
      const user = request.user as User;
      if (!canWriteCollection(user, 'faculty')) {
        return { status: 403 as const, body: { type: 'forbidden', message: 'Insufficient permissions' } };
      }
      const payload = { ...(body as Record<string, unknown>), id };
      const lang = (request.headers['accept-language'] as string) || 'en';
      const tenant = request.tenant?.id;
      if (tenant) {
        try {
          await validateFacultyDynamic(tenant, payload, lang);
        } catch (error) {
          return {
            status: 400 as const,
            body: { type: 'validation_error', message: error instanceof Error ? error.message : String(error) },
          };
        }
      }
      try {
        const updated = await withTenant(
          String(tenant),
          () => facultyUseCases.updateTeacherById(id, body),
          { readOnly: false },
        );
        if (!updated) {
          return { status: 404 as const, body: { type: 'not_found', message: 'Faculty member not found' } };
        }
        await auditFaculty(user, 'faculty.update', `Updated faculty member ${id}`, id);
        const sanitized = await sanitizeOneFacultyForUser(updated as Teacher, user);
        return {
          status: 200 as const,
          body: { success: true as const, faculty: sanitized, teacher: sanitized },
        };
      } catch {
        return { status: 500 as const, body: { type: 'database_error', message: 'Failed to update faculty member' } };
      }
    },

    delete: async ({ params: { id }, body, request }: ContractRouteArgs<typeof facultyContract['delete']>): Promise<ContractRouteResponse<typeof facultyContract['delete']>> => {
      const user = request.user as User;
      if (!canDeleteCollection(user, 'faculty')) {
        return { status: 403 as const, body: { type: 'forbidden', message: 'Insufficient permissions' } };
      }
      try {
        const reason = body?.deletionReason;
        const deleted = await withTenant(String(request.tenant?.id), () => facultyUseCases.deleteTeacherById(id, String(user.id), reason), { readOnly: false });
        if (!deleted) return { status: 404 as const, body: { type: 'not_found', message: 'Faculty member not found' } };
        const reasonNote = reason?.trim() ? ` — ${reason.trim()}` : '';
        await auditFaculty(user, 'faculty.soft_delete', `Soft-deleted faculty member ${id}${reasonNote}`, id);
        return { status: 200 as const, body: { success: true as const } };
      } catch {
        return { status: 500 as const, body: { type: 'database_error', message: 'Failed to delete faculty member' } };
      }
    },

    bulkStatus: async ({ body, request }: ContractRouteArgs<typeof facultyContract['bulkStatus']>): Promise<ContractRouteResponse<typeof facultyContract['bulkStatus']>> => {
      const user = request.user as User;
      if (!canWriteCollection(user, 'faculty')) {
        return { status: 403 as const, body: { type: 'forbidden', message: 'Insufficient permissions' } };
      }
      try {
        const result = await withTenant(String(request.tenant?.id), () =>
          facultyUseCases.bulkUpdateTeacherStatus(
            body.ids.map(String),
            body.status,
          ), { readOnly: false });
        await auditFaculty(
          user,
          'faculty.bulk_status',
          `Updated status to ${body.status} for ${result.succeeded} faculty member(s); ${result.failed} failed`,
        );
        return { status: 200 as const, body: { success: true as const, ...result } };
      } catch {
        return { status: 500 as const, body: { type: 'database_error', message: 'Failed to bulk update faculty status' } };
      }
    },

    bulkSpecialization: async ({ body, request }: ContractRouteArgs<typeof facultyContract['bulkSpecialization']>): Promise<ContractRouteResponse<typeof facultyContract['bulkSpecialization']>> => {
      const user = request.user as User;
      if (!canWriteCollection(user, 'faculty')) {
        return { status: 403 as const, body: { type: 'forbidden', message: 'Insufficient permissions' } };
      }
      try {
        const result = await withTenant(String(request.tenant?.id), () =>
          facultyUseCases.bulkUpdateTeacherSpecialization(
            body.ids.map(String),
            body.specialization,
          ), { readOnly: false });
        await auditFaculty(
          user,
          'faculty.bulk_specialization',
          `Updated specialization to ${body.specialization} for ${result.succeeded} faculty member(s); ${result.failed} failed`,
        );
        return { status: 200 as const, body: { success: true as const, ...result } };
      } catch {
        return { status: 500 as const, body: { type: 'database_error', message: 'Failed to bulk update faculty specialization' } };
      }
    },

    duplicateCheck: async ({ body, request }: ContractRouteArgs<typeof facultyContract['duplicateCheck']>): Promise<ContractRouteResponse<typeof facultyContract['duplicateCheck']>> => {
      const user = request.user as User;
      if (!canWriteCollection(user, 'faculty')) {
        return { status: 403 as const, body: { type: 'forbidden', message: 'Insufficient permissions' } };
      }
      try {
        const result = await withTenant(String(request.tenant?.id), () =>
          facultyUseCases.checkTeacherRegistrationDuplicate(body), { readOnly: false });
        return { status: 200 as const, body: result };
      } catch {
        return { status: 500 as const, body: { type: 'database_error', message: 'Failed to check duplicate' } };
      }
    },

    nextEmployeeId: async ({ query, request }: ContractRouteArgs<typeof facultyContract['nextEmployeeId']>): Promise<ContractRouteResponse<typeof facultyContract['nextEmployeeId']>> => {
      const user = request.user as User;
      if (!canReadCollection(user, 'faculty')) {
        return { status: 403 as const, body: { type: 'forbidden', message: 'Insufficient permissions' } };
      }
      try {
        const employeeId = await withTenant(String(request.tenant?.id), () =>
          facultyUseCases.computeNextTeacherEmployeeIdForSettings({
            idPrefix: query.prefix,
            idTemplate: query.template,
            idDigits: query.digits,
            idStartSeq: query.startSeq,
            idRestartAnnually: query.restartAnnually,
          }), { readOnly: true });
        return { status: 200 as const, body: { employeeId } };
      } catch {
        return { status: 500 as const, body: { type: 'database_error', message: 'Failed to compute next employee ID' } };
      }
    },

    migrateEmployeeIds: async ({ request }: ContractRouteArgs<typeof facultyContract['migrateEmployeeIds']>): Promise<ContractRouteResponse<typeof facultyContract['migrateEmployeeIds']>> => {
      const user = request.user as User;
      if (!roleHasPermission(user.role, FACULTY_MODULE_MANIFEST.permissions.setupWrite)) {
        return { status: 403 as const, body: { type: 'forbidden', message: 'Insufficient permissions' } };
      }
      try {
        const result = await withTenant(String(request.tenant?.id), () =>
          facultyUseCases.migrateTeachersMissingEmployeeIds(), { readOnly: false });
        return { status: 200 as const, body: { success: true as const, ...result } };
      } catch {
        return { status: 500 as const, body: { type: 'database_error', message: 'Failed to migrate employee IDs' } };
      }
    },
  } as unknown as RouterImplementation<typeof facultyContract>);

  await fastify.register(s.plugin(router), {
    requestValidationErrorHandler: (err, _request, reply) => {
      const zErr = err.body ?? err.query ?? err.pathParams ?? err.headers;
      const message = zErr instanceof Error ? zErr.message : err.message;
      void replyValidationError(reply, message);
    },
  });
};

export const teacherCrudRoutes = facultyCrudRoutes;
