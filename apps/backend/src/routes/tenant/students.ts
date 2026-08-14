import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { authenticateTenant } from '../../middleware/authenticate.js';
import { requireTenantModule } from '../../middleware/requireTenantModule.js';
import { canDeleteCollection, canReadCollection } from '../../services/rbacService.js';
import {
  STUDENTS_MODULE_MANIFEST,
  studentRecordSchema,
  type Student,
  type StudentsListPageResult,
  type StudentsWidgetQuery,
  type User,
} from '@mms/shared';
import { studentsListQuerySchema } from '../../validation/studentSchemas.js';
import { validateStudentDynamic } from '../../services/studentValidationService.js';
import { studentUseCases } from '../../students/use-cases/studentUseCases.js';
import {
  registerMetricsRoute,
  registerCountRoute,
  registerResolveRoute,
  registerWidgetAggregatesRoute,
  registerPaginatedListRoute,
  registerLinkedContactIdsRoute,
} from '../../lib/crudRouter.js';
import { registerResourceRoutes } from '../../lib/crudResourceRoutes.js';
import { registerColumnPreferencesRoutes } from '../../lib/columnPreferencesRouter.js';
import { registerFieldUsageRoutes } from '../../lib/registerFieldUsageRoutes.js';
import { studentSetupConfigRoutes } from './students/studentSetupConfigRoutes.js';
import { studentLookupRoutes } from './students/studentLookupRoutes.js';
import { studentExportRoutes } from './students/studentExportRoutes.js';
import { studentOperationRoutes } from './students/studentOperationRoutes.js';
import { studentSoftDeleteRoutes } from './students/studentSoftDeleteRoutes.js';
import {
  auditStudent,
  loadStudentWriteSchema,
  sanitizeOneStudentForUser,
  sanitizeStudentsForUser,
} from './students/studentRouteHelpers.js';

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

  await fastify.register(studentSetupConfigRoutes);
  await fastify.register(studentLookupRoutes);
  await fastify.register(studentExportRoutes);
  await fastify.register(studentOperationRoutes);

  registerFieldUsageRoutes(fastify, {
    canRead: (user) => canReadCollection(user, 'students'),
    loadCount: (fieldKey) => studentUseCases.loadStudentFieldUsageCount(fieldKey),
    loadCounts: (fieldKeys) => studentUseCases.loadStudentFieldUsageCounts(fieldKeys),
  });

  registerPaginatedListRoute(fastify, {
    collection: 'students',
    schema: studentsListQuerySchema,
    defaultPageSize: STUDENTS_MODULE_MANIFEST.defaultPageSize,
    errorMessagePrefix: 'students',
    canWriteDeletedCheck: (user) => canDeleteCollection(user, 'students'),
    loadPageFn: (query) => studentUseCases.loadStudentsPage(query),
    responseTransform: async (result: StudentsListPageResult, user) => ({
      ...result,
      students: await sanitizeStudentsForUser(result.students, user),
    }),
  });

  registerCountRoute(fastify, {
    collection: 'students',
    loadCountFn: () => studentUseCases.countStudents(),
    errorMessagePrefix: 'students',
  });

  registerMetricsRoute(fastify, {
    collection: 'students',
    loadMetricsFn: () => studentUseCases.loadStudentsCommandMetrics(),
    errorMessagePrefix: 'student',
  });

  registerWidgetAggregatesRoute(fastify, {
    collection: 'students',
    loadAggregatesFn: (queries) =>
      studentUseCases.loadStudentsWidgetAggregates(queries as unknown as StudentsWidgetQuery[]),
    errorMessagePrefix: 'student',
  });

  registerResolveRoute(fastify, {
    collection: 'students',
    loadByIdsFn: async (ids, request) => {
      const students = await studentUseCases.loadStudentsByIds(ids);
      return sanitizeStudentsForUser(students, request.user as User);
    },
    responseKey: 'students',
    errorMessagePrefix: 'students',
  });

  registerLinkedContactIdsRoute(fastify, {
    collection: 'students',
    loadLinkedContactIdsFn: (excludeId) => studentUseCases.loadStudentLinkedContactIds(excludeId),
    errorMessagePrefix: 'students',
  });

  registerColumnPreferencesRoutes(fastify, {
    collection: 'students',
    objectKey: STUDENTS_MODULE_MANIFEST.columnPreferencesObjectKey,
  });

  registerResourceRoutes(fastify, {
    collection: 'students',
    schema: studentRecordSchema as never,
    buildWriteSchema: async () => loadStudentWriteSchema() as never,
    nameSingular: 'student',
    namePlural: 'students',
    customGetRoute: true,
    customGetSingleRoute: false,
    customPostRoute: true,
    loadByIdFn: (id, includeDeleted) => studentUseCases.loadStudentById(id, includeDeleted),
    updateFn: studentUseCases.updateStudentById,
    validateDynamicFn: validateStudentDynamic as never,
    buildSingleResponse: (item, user) => sanitizeOneStudentForUser(item as Student, user),
    onAfterUpdate: async (user, id) => {
      await auditStudent(user, 'student.update', `Updated student ${id}`, id);
    },
  });

  await fastify.register(studentSoftDeleteRoutes);
}
