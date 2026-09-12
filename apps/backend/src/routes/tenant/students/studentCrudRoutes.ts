import type { FastifyPluginAsync } from 'fastify';
import { withTenant } from '../../../db/tenant-context.js';
import { canDeleteCollection, canWriteCollection, canReadCollection } from '../../../services/rbacService.js';
import {
  STUDENTS_MODULE_MANIFEST,
  roleHasPermission,
  isQueryFlagTrue,
  type User,
  type Student,
  studentContract,
} from '@mms/shared';
import { validateStudentDynamic } from '../../../services/studentValidationService.js';
import { studentUseCases } from '../../../students/use-cases/studentUseCases.js';
import { initServer } from '@ts-rest/fastify';
import type { ContractRouteArgs, ContractRouteResponse } from '../../../lib/contractRouterTypes.js';
import { replyValidationError } from '../../../lib/zodRequest.js';
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
    list: async ({ query, request }: ContractRouteArgs<typeof studentContract['list']>): Promise<ContractRouteResponse<typeof studentContract['list']>> => {
      const user = request.user as User;

      if (!canReadCollection(user, 'students')) {
        return { status: 403 as const, body: { type: 'forbidden', message: 'Insufficient permissions' } };
      }

      const includeDeleted = isQueryFlagTrue(query?.includeDeleted);

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

    get: async ({ params: { id }, query, request }: ContractRouteArgs<typeof studentContract['get']>): Promise<ContractRouteResponse<typeof studentContract['get']>> => {
      const user = request.user as User;

      if (!canReadCollection(user, 'students')) {
        return { status: 403 as const, body: { type: 'forbidden', message: 'Insufficient permissions' } };
      }

      try {
        const includeDeleted = isQueryFlagTrue((query as { includeDeleted?: unknown })?.includeDeleted);
        if (includeDeleted && !canDeleteCollection(user, 'students')) {
          return { status: 403 as const, body: { type: 'forbidden', message: 'Viewing deleted students requires delete permissions' } };
        }
        const item = await withTenant(String(request.tenant?.id), () => studentUseCases.loadStudentById(id, includeDeleted), { readOnly: true });
        if (!item || (!includeDeleted && (item as { deletedAt?: unknown }).deletedAt != null)) {
          return { status: 404 as const, body: { type: 'not_found', message: 'Student not found' } };
        }
        const response = await sanitizeOneStudentForUser(item as Student, user);
        return { status: 200 as const, body: { student: response } };
      } catch (error: unknown) {
        return { status: 500 as const, body: { type: 'database_error', message: 'Failed to load student' } };
      }
    },

    create: async ({ body, request }: ContractRouteArgs<typeof studentContract['create']>): Promise<ContractRouteResponse<typeof studentContract['create']>> => {
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
          body,
          user,
        ), { readOnly: false });

        if (result.restored) {
          await auditStudent(user, 'student.restore', `Restored student ${result.record.id} via re-registration`, String(result.record.id));
        } else {
          await auditStudent(user, 'student.create', `Created student ${result.record.id}`, String(result.record.id));
        }

        const response = await sanitizeOneStudentForUser(result.record as Student, user);
        return result.restored
          ? { status: 200 as const, body: { student: response } }
          : { status: 201 as const, body: { student: response } };
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
        request.log.error(error, 'Failed to create student');
        return { status: 500 as const, body: { type: 'database_error', message: 'Failed to create student' } };
      }
    },

    update: async ({ params: { id }, body, request }: ContractRouteArgs<typeof studentContract['update']>): Promise<ContractRouteResponse<typeof studentContract['update']>> => {
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
          ...body,
          id,
        }), { readOnly: false });

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

    delete: async ({ params: { id }, body, request }: ContractRouteArgs<typeof studentContract['delete']>): Promise<ContractRouteResponse<typeof studentContract['delete']>> => {
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

    bulkStatus: async ({ body, request }: ContractRouteArgs<typeof studentContract['bulkStatus']>): Promise<ContractRouteResponse<typeof studentContract['bulkStatus']>> => {
      const user = request.user as User;
      if (!canWriteCollection(user, 'students')) {
        return { status: 403 as const, body: { type: 'forbidden', message: 'Insufficient permissions' } };
      }
      try {
        const result = await withTenant(String(request.tenant?.id), () =>
          studentUseCases.bulkUpdateStudentStatus(
            body.ids.map(String),
            body.status,
          ), { readOnly: false });
        await auditStudent(
          user,
          'student.bulk_status',
          `Updated status to ${body.status} for ${result.succeeded} student(s); ${result.failed} failed`,
        );
        return { status: 200 as const, body: { success: true, ...result } };
      } catch {
        return { status: 500 as const, body: { type: 'database_error', message: 'Failed to bulk update student status' } };
      }
    },

    bulkEnroll: async ({ body, request }: ContractRouteArgs<typeof studentContract['bulkEnroll']>): Promise<ContractRouteResponse<typeof studentContract['bulkEnroll']>> => {
      const user = request.user as User;
      if (!canWriteCollection(user, 'students')) {
        return { status: 403 as const, body: { type: 'forbidden', message: 'Insufficient permissions' } };
      }
      try {
        const result = await withTenant(String(request.tenant?.id), () =>
          studentUseCases.bulkEnrollStudents({
            studentIds: body.studentIds.map(String),
            sessionIds: body.sessionIds.map(String),
            mode: body.mode,
          }), { readOnly: false });
        await auditStudent(
          user,
          'student.bulk_enroll',
          `Updated session enrollments (${body.mode}) for ${result.succeeded} student(s)`,
        );
        return { status: 200 as const, body: { success: true, ...result } };
      } catch {
        return { status: 500 as const, body: { type: 'database_error', message: 'Failed to bulk enroll students' } };
      }
    },

    nextGrNumber: async ({ query, request }: ContractRouteArgs<typeof studentContract['nextGrNumber']>): Promise<ContractRouteResponse<typeof studentContract['nextGrNumber']>> => {
      const user = request.user as User;
      if (!canReadCollection(user, 'students')) {
        return { status: 403 as const, body: { type: 'forbidden', message: 'Insufficient permissions' } };
      }
      try {
        const grNumber = await withTenant(String(request.tenant?.id), () =>
          studentUseCases.computeNextGrNumberForDate(query.registeredDate, {
            grNumberTemplate: query.template ?? '{seq}-{year}',
            grNumberDigits: query.digits ?? 4,
            grNumberRestartAnnually: query.restartAnnually ?? true,
          }), { readOnly: true });
        return { status: 200 as const, body: { grNumber } };
      } catch {
        return { status: 500 as const, body: { type: 'database_error', message: 'Failed to compute next GR number' } };
      }
    },

    duplicateCheck: async ({ body, request }: ContractRouteArgs<typeof studentContract['duplicateCheck']>): Promise<ContractRouteResponse<typeof studentContract['duplicateCheck']>> => {
      const user = request.user as User;
      if (!canWriteCollection(user, 'students')) {
        return { status: 403 as const, body: { type: 'forbidden', message: 'Insufficient permissions' } };
      }
      try {
        const result = await withTenant(String(request.tenant?.id), () =>
          studentUseCases.checkStudentRegistrationDuplicate(body as Parameters<typeof studentUseCases.checkStudentRegistrationDuplicate>[0]), { readOnly: false });
        return { status: 200 as const, body: result };
      } catch (error: unknown) {
        request.log.error(error, 'Failed to check student duplicate');
        return { status: 500 as const, body: { type: 'database_error', message: 'Failed to check duplicate' } };
      }
    },

    migrateGrNumbers: async ({ request }: ContractRouteArgs<typeof studentContract['migrateGrNumbers']>): Promise<ContractRouteResponse<typeof studentContract['migrateGrNumbers']>> => {
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

  await fastify.register(s.plugin(router), {
    requestValidationErrorHandler: (err, _request, reply) => {
      const zErr = err.body ?? err.query ?? err.pathParams ?? err.headers;
      const message = zErr instanceof Error ? zErr.message : err.message;
      void replyValidationError(reply, message);
    },
  });
};
