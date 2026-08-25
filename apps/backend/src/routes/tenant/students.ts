import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { authenticateTenant } from '../../middleware/authenticate.js';
import { requireTenantModule } from '../../middleware/requireTenantModule.js';
import { withTenant } from '../../db/tenant-context.js';
import { canDeleteCollection, canWriteCollection, canReadCollection } from '../../services/rbacService.js';
import {
  STUDENTS_MODULE_MANIFEST,
  roleHasPermission,
  type StudentsWidgetQuery,
  type User,
  type Student,
} from '@mms/shared';
import { validateStudentDynamic } from '../../services/studentValidationService.js';
import { studentUseCases } from '../../students/use-cases/studentUseCases.js';
import {
  registerMetricsRoute,
  registerCountRoute,
  registerResolveRoute,
  registerWidgetAggregatesRoute,
  registerLinkedContactIdsRoute,
} from '../../lib/crudRouter.js';

import { studentSetupConfigRoutes } from './students/studentSetupConfigRoutes.js';
import { studentLookupRoutes } from './students/studentLookupRoutes.js';
import { studentExportRoutes } from './students/studentExportRoutes.js';
import { studentSoftDeleteRoutes } from './students/studentSoftDeleteRoutes.js';
import {
  auditStudent,
  sanitizeOneStudentForUser,
  sanitizeStudentsForUser,
} from './students/studentRouteHelpers.js';
import { rootContract } from '@mms/shared';
import { initServer } from '@ts-rest/fastify';
import { StudentPermissionError } from '../../students/use-cases/studentNormalizeUseCases.js';

const s = initServer();

/**
 * Server-first student resource routes (TanStack Query on FE).
 *
 * Mirrors the Contacts route composition: granular registrars bound to the
 * `studentUseCases` composition root, sanitized reads, and audit hooks.
 */
export default async function studentsRoutes(
  fastify: FastifyInstance,
  _options: FastifyPluginOptions,
): Promise<void> {
  fastify.addHook('preHandler', authenticateTenant);
  fastify.addHook('preHandler', requireTenantModule('students'));

  await fastify.register(studentSetupConfigRoutes, { prefix: '/api/students' });
  await fastify.register(studentLookupRoutes, { prefix: '/api/students' });
  await fastify.register(studentExportRoutes, { prefix: '/api/students' });

  await fastify.register(
    async (sub) => {
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
    },
    { prefix: '/api/students' },
  );

  const router = s.router(rootContract.students, {
    list: async ({ query, request }: any) => {
      const user = request.user as User;
      
      if (!canReadCollection(user, 'students')) {
        return { status: 403 as const, body: { type: 'forbidden', message: 'Insufficient permissions' } as any };
      }

      const includeDeleted = query.includeDeleted === 'true' || query.includeDeleted === true;

      if (includeDeleted && !canDeleteCollection(user, 'students')) {
        return { status: 403 as const, body: { type: 'forbidden', message: 'Viewing deleted students requires delete permissions' } as any };
      }

      const result = await withTenant(String(request.tenant?.id), () => studentUseCases.loadStudentsPage({
        ...query,
        includeDeleted,
      }), { readOnly: true });

      return {
        status: 200 as const,
        body: {
          ...result,
          students: await sanitizeStudentsForUser(result.students, user),
        },
      };
    },

    get: async ({ params: { id }, query, request }: any) => {
      const user = request.user as User;
      
      if (!canReadCollection(user, 'students')) {
        return { status: 403 as const, body: { type: 'forbidden', message: 'Insufficient permissions' } as any };
      }

      try {
        const includeDeleted = query.includeDeleted === true || query.includeDeleted === 'true';
        if (includeDeleted && !canDeleteCollection(user, 'students')) {
          return { status: 403 as const, body: { type: 'forbidden', message: 'Viewing deleted students requires delete permissions' } as any };
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

    create: async ({ body, request }: any) => {
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
          { ...body, workspaceId: (user as any).workspaceId } as never,
          user,
        ), { readOnly: false });
        
        if (result.restored) {
          await auditStudent(user, 'student.restore', `Restored student ${result.record.id} via re-registration`, String(result.record.id));
        } else {
          await auditStudent(user, 'student.create', `Created student ${result.record.id}`, String(result.record.id));
        }

        const response = await sanitizeOneStudentForUser(result.record as Student, user);
        return { status: (result.restored ? 200 : 201) as any, body: { student: response } };
      } catch (error: unknown) {
        if (error instanceof StudentPermissionError) {
          return { status: 403 as const, body: { type: 'forbidden', message: error.message } };
        }
        if (error && typeof error === 'object' && 'type' in error && 'field' in error) {
          return {
            status: 400 as const,
            body: {
              type: (error as any).type,
              message: (error as any).message,
              errors: [{ field: (error as any).field, message: (error as any).message }],
            },
          };
        }
        return { status: 500 as const, body: { type: 'database_error', message: 'Failed to create student' } };
      }
    },

    update: async ({ params: { id }, body, request }: any) => {
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
        } as never), { readOnly: false });

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

    delete: async ({ params: { id }, body, request }: any) => {
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

    bulkStatus: async ({ body, request }: any) => {
      const user = request.user as User;
      if (!canWriteCollection(user, 'students')) {
        return { status: 403 as const, body: { type: 'forbidden', message: 'Insufficient permissions' } };
      }
      try {
        const result = await withTenant(String(request.tenant?.id), () =>
          studentUseCases.bulkUpdateStudentStatus(
            (body as any).ids.map(String),
            (body as any).status,
          ), { readOnly: false });
        await auditStudent(
          user,
          'student.bulk_status',
          `Updated status to ${(body as any).status} for ${result.succeeded} student(s); ${result.failed} failed`,
        );
        return { status: 200 as const, body: { success: true, ...result } };
      } catch {
        return { status: 500 as const, body: { type: 'database_error', message: 'Failed to bulk update student status' } };
      }
    },

    bulkEnroll: async ({ body, request }: any) => {
      const user = request.user as User;
      if (!canWriteCollection(user, 'students')) {
        return { status: 403 as const, body: { type: 'forbidden', message: 'Insufficient permissions' } };
      }
      try {
        const result = await withTenant(String(request.tenant?.id), () =>
          studentUseCases.bulkEnrollStudents({
            studentIds: (body as any).studentIds.map(String),
            sessionIds: (body as any).sessionIds.map(String),
            mode: (body as any).mode,
          }), { readOnly: false });
        await auditStudent(
          user,
          'student.bulk_enroll',
          `Updated session enrollments (${(body as any).mode}) for ${result.succeeded} student(s)`,
        );
        return { status: 200 as const, body: { success: true, ...result } };
      } catch {
        return { status: 500 as const, body: { type: 'database_error', message: 'Failed to bulk enroll students' } };
      }
    },

    nextGrNumber: async ({ query, request }: any) => {
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

    duplicateCheck: async ({ body, request }: any) => {
      const user = request.user as User;
      if (!canWriteCollection(user, 'students')) {
        return { status: 403 as const, body: { type: 'forbidden', message: 'Insufficient permissions' } };
      }
      try {
        const result = await withTenant(String(request.tenant?.id), () =>
          studentUseCases.checkStudentRegistrationDuplicate(body as never), { readOnly: false });
        return { status: 200 as const, body: result };
      } catch {
        return { status: 500 as const, body: { type: 'database_error', message: 'Failed to check duplicate' } };
      }
    },

    migrateGrNumbers: async ({ request }: any) => {
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
  } as any);

  await fastify.register(s.plugin(router));
}
