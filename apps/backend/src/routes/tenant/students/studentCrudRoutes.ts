import type { FastifyPluginAsync } from 'fastify';
import { withTenant } from '../../../db/tenant-context.js';
import { canDeleteCollection, canWriteCollection, canReadCollection } from '../../../services/rbacService.js';
import {
  STUDENTS_MODULE_MANIFEST,
  roleHasPermission,
  type User,
  type Student,
  studentContract,
} from '@mms/shared';
import { validateStudentDynamic } from '../../../services/studentValidationService.js';
import { studentUseCases } from '../../../students/use-cases/studentUseCases.js';
import { initServer } from '@ts-rest/fastify';
import type { ContractRouteArgs } from '../../../lib/contractRouterTypes.js';
import { StudentPermissionError } from '../../../students/use-cases/studentNormalizeUseCases.js';
import {
  auditStudent,
  sanitizeOneStudentForUser,
  sanitizeStudentsForUser,
} from './studentRouteHelpers.js';

const s = initServer();

/** Main student CRUD — @ts-rest contract router. */
export const studentCrudRoutes: FastifyPluginAsync = async (fastify) => {
  const router = s.router(studentContract, {
    list: async ({ query, request }: ContractRouteArgs<typeof studentContract['list']>): Promise<unknown> => {
      const user = request.user as User;

      if (!canReadCollection(user, 'students')) {
        return { status: 403 as const, body: { type: 'forbidden', message: 'Insufficient permissions' } };
      }

      const includeDeleted = query.includeDeleted === 'true' || query.includeDeleted === true;

      if (includeDeleted && !canDeleteCollection(user, 'students')) {
        return { status: 403 as const, body: { type: 'forbidden', message: 'Viewing deleted students requires delete permissions' } };
      }

      const result = await withTenant(String(request.tenant?.id), () => studentUseCases.loadStudentsPage({
        ...query,
        includeDeleted,
      } as Parameters<typeof studentUseCases.loadStudentsPage>[0]), { readOnly: true });

      return {
        status: 200 as const,
        body: {
          ...result,
          students: await sanitizeStudentsForUser(result.students, user),
        },
      };
    },

    get: async ({ params: { id }, query, request }: ContractRouteArgs<typeof studentContract['get']>): Promise<unknown> => {
      const user = request.user as User;

      if (!canReadCollection(user, 'students')) {
        return { status: 403 as const, body: { type: 'forbidden', message: 'Insufficient permissions' } };
      }

      try {
        const includeDeleted = (query as { includeDeleted?: boolean | 'true' | 'false' }).includeDeleted === true || (query as { includeDeleted?: boolean | 'true' | 'false' }).includeDeleted === 'true';
        if (includeDeleted && !canDeleteCollection(user, 'students')) {
          return { status: 403 as const, body: { type: 'forbidden', message: 'Viewing deleted students requires delete permissions' } };
        }
        const item = await withTenant(String(request.tenant?.id), () => studentUseCases.loadStudentById(id, includeDeleted), { readOnly: true });
        if (!item) {
          return { status: 404 as const, body: { type: 'not_found', message: 'Student not found' } };
        }
        const response = await sanitizeOneStudentForUser(item as Student, user);
        return { status: 200 as const, body: { student: response } };
      } catch (error: unknown) {
        return { status: 500 as const, body: { type: 'database_error', message: 'Failed to load student' } };
      }
    },

    create: async ({ body, request }: ContractRouteArgs<typeof studentContract['create']>): Promise<unknown> => {
      const user = request.user as User;
      if (!canWriteCollection(user, 'students')) {
        return { status: 403 as const, body: { type: 'forbidden', message: 'Insufficient permissions' } };
      }

      const lang = (request.headers['accept-language'] as string) || 'en';
      const tenant = request.tenant?.id;

      if (tenant) {
        try {
          await validateStudentDynamic(tenant, body, lang);
        } catch (error) {
          return {
            status: 400 as const,
            body: {
              type: 'validation_error',
              message: error instanceof Error ? error.message : String(error),
            },
          };
        }
      }

      try {
        const result = await withTenant(String(tenant), () => studentUseCases.createStudent(
          // (typed as User & { workspaceId? } because the legacy JWT payload may carry workspaceId;
          //  it is not on the shared User type)
          { ...(body as Record<string, unknown>), workspaceId: (user as User & { workspaceId?: string }).workspaceId } as unknown as Parameters<typeof studentUseCases.createStudent>[0],
          user,
        ), { readOnly: false });

        if (result.restored) {
          await auditStudent(user, 'student.restore', `Restored student ${result.record.id} via re-registration`, String(result.record.id));
        } else {
          await auditStudent(user, 'student.create', `Created student ${result.record.id}`, String(result.record.id));
        }

        const response = await sanitizeOneStudentForUser(result.record as Student, user);
        return { status: (result.restored ? 200 : 201) as 200 | 201, body: { student: response } };
      } catch (error: unknown) {
        if (error instanceof StudentPermissionError) {
          return { status: 403 as const, body: { type: 'forbidden', message: error.message } };
        }
        if (error && typeof error === 'object' && 'type' in error && 'field' in error) {
          // (typed as the error shape just guarded above)
          const e = error as { type: string; message: string; field: string };
          return {
            status: 400 as const,
            body: {
              type: e.type,
              message: e.message,
              errors: [{ field: e.field, message: e.message }],
            },
          };
        }
        return { status: 500 as const, body: { type: 'database_error', message: 'Failed to create student' } };
      }
    },

    update: async ({ params: { id }, body, request }: ContractRouteArgs<typeof studentContract['update']>): Promise<unknown> => {
      const user = request.user as User;
      if (!canWriteCollection(user, 'students')) {
        return { status: 403 as const, body: { type: 'forbidden', message: 'Insufficient permissions' } };
      }

      const lang = (request.headers['accept-language'] as string) || 'en';
      const tenant = request.tenant?.id;
      if (tenant) {
        try {
          await validateStudentDynamic(tenant, body, lang);
        } catch (error) {
          return {
            status: 400 as const,
            body: {
              type: 'validation_error',
              message: error instanceof Error ? error.message : String(error),
            },
          };
        }
      }

      try {
        const updated = await withTenant(String(tenant), () => studentUseCases.updateStudentById(id, {
          ...(body as Record<string, unknown>),
          id,
        } as unknown as Parameters<typeof studentUseCases.updateStudentById>[1]), { readOnly: false });

        if (!updated) {
          return { status: 404 as const, body: { type: 'not_found', message: 'Student not found' } };
        }

        await auditStudent(user, 'student.update', `Updated student ${id}`, id);
        const response = await sanitizeOneStudentForUser(updated as Student, user);
        return { status: 200 as const, body: { student: response } };
      } catch (error: unknown) {
        return { status: 500 as const, body: { type: 'database_error', message: 'Failed to update student' } };
      }
    },

    delete: async ({ params: { id }, body, request }: ContractRouteArgs<typeof studentContract['delete']>): Promise<unknown> => {
      const user = request.user as User;
      if (!canDeleteCollection(user, 'students')) {
        return { status: 403 as const, body: { type: 'forbidden', message: 'Insufficient permissions' } };
      }

      try {
        const reason = body?.deletionReason;
        const deleted = await withTenant(String(request.tenant?.id), () => studentUseCases.softDeleteStudentById(id, String(user.id), reason), { readOnly: false });
        if (!deleted) {
          return { status: 404 as const, body: { type: 'not_found', message: 'Student not found' } };
        }

        const reasonNote = reason?.trim() ? ` — ${reason.trim()}` : '';
        await auditStudent(user, 'student.soft_delete', `Soft-deleted student ${id}${reasonNote}`, id);

        return { status: 200 as const, body: { success: true } };
      } catch (error: unknown) {
        return { status: 500 as const, body: { type: 'database_error', message: 'Failed to delete student' } };
      }
    },

    bulkStatus: async ({ body, request }: ContractRouteArgs<typeof studentContract['bulkStatus']>): Promise<unknown> => {
      const user = request.user as User;
      const { ids, status } = body as { ids: (string | number)[]; status: string };
      if (!canWriteCollection(user, 'students')) {
        return { status: 403 as const, body: { type: 'forbidden', message: 'Insufficient permissions' } };
      }
      try {
        const result = await withTenant(String(request.tenant?.id), () =>
          studentUseCases.bulkUpdateStudentStatus(
            ids.map(String),
            status,
          ), { readOnly: false });
        await auditStudent(
          user,
          'student.bulk_status',
          `Updated status to ${status} for ${result.succeeded} student(s); ${result.failed} failed`,
        );
        return { status: 200 as const, body: { success: true, ...result } };
      } catch {
        return { status: 500 as const, body: { type: 'database_error', message: 'Failed to bulk update student status' } };
      }
    },

    bulkEnroll: async ({ body, request }: ContractRouteArgs<typeof studentContract['bulkEnroll']>): Promise<unknown> => {
      const user = request.user as User;
      const { studentIds, sessionIds, mode } = body as { studentIds: (string | number)[]; sessionIds: (string | number)[]; mode: string };
      if (!canWriteCollection(user, 'students')) {
        return { status: 403 as const, body: { type: 'forbidden', message: 'Insufficient permissions' } };
      }
      try {
        const result = await withTenant(String(request.tenant?.id), () =>
          studentUseCases.bulkEnrollStudents({
            studentIds: studentIds.map(String),
            sessionIds: sessionIds.map(String),
            mode: mode as 'add' | 'remove' | 'replace',
          }), { readOnly: false });
        await auditStudent(
          user,
          'student.bulk_enroll',
          `Updated session enrollments (${mode}) for ${result.succeeded} student(s)`,
        );
        return { status: 200 as const, body: { success: true, ...result } };
      } catch {
        return { status: 500 as const, body: { type: 'database_error', message: 'Failed to bulk enroll students' } };
      }
    },

    nextGrNumber: async ({ query, request }: ContractRouteArgs<typeof studentContract['nextGrNumber']>): Promise<unknown> => {
      const user = request.user as User;
      if (!canReadCollection(user, 'students')) {
        return { status: 403 as const, body: { type: 'forbidden', message: 'Insufficient permissions' } };
      }
      try {
        const grNumber = await withTenant(String(request.tenant?.id), () =>
          studentUseCases.computeNextGrNumberForDate(query.registeredDate, {
            grNumberTemplate: query.template ?? '{seq}-{year}',
            grNumberDigits: query.digits ?? 4,
            grNumberRestartAnnually: query.restartAnnually === 'true' ? true : (query.restartAnnually === 'false' ? false : true),
          }), { readOnly: true });
        return { status: 200 as const, body: { grNumber } };
      } catch {
        return { status: 500 as const, body: { type: 'database_error', message: 'Failed to compute next GR number' } };
      }
    },

    duplicateCheck: async ({ body, request }: ContractRouteArgs<typeof studentContract['duplicateCheck']>): Promise<unknown> => {
      const user = request.user as User;
      if (!canWriteCollection(user, 'students')) {
        return { status: 403 as const, body: { type: 'forbidden', message: 'Insufficient permissions' } };
      }
      try {
        const result = await withTenant(String(request.tenant?.id), () =>
          studentUseCases.checkStudentRegistrationDuplicate(body as Parameters<typeof studentUseCases.checkStudentRegistrationDuplicate>[0]), { readOnly: false });
        return { status: 200 as const, body: result };
      } catch {
        return { status: 500 as const, body: { type: 'database_error', message: 'Failed to check duplicate' } };
      }
    },

    migrateGrNumbers: async ({ request }: ContractRouteArgs<typeof studentContract['migrateGrNumbers']>): Promise<unknown> => {
      const user = request.user as User;
      if (!roleHasPermission(user.role, STUDENTS_MODULE_MANIFEST.permissions.setupWrite)) {
        return { status: 403 as const, body: { type: 'forbidden', message: 'Insufficient permissions' } };
      }
      try {
        const result = await withTenant(String(request.tenant?.id), () =>
          studentUseCases.migrateStudentsMissingGrNumbers(), { readOnly: false });
        return { status: 200 as const, body: { success: true, ...result } };
      } catch {
        return { status: 500 as const, body: { type: 'database_error', message: 'Failed to migrate GR numbers' } };
      }
    },
  } as unknown as Parameters<typeof s.router>[1]);

  await fastify.register(s.plugin(router));
};
