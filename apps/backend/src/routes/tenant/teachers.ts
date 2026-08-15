import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { authenticateTenant } from '../../middleware/authenticate.js';
import { requireTenantModule } from '../../middleware/requireTenantModule.js';
import { canDeleteCollection } from '../../services/rbacService.js';
import { teacherUseCases } from '../../teachers/use-cases/teacherUseCases.js';
import { TEACHERS_MODULE_MANIFEST, type Teacher, type User } from '@mms/shared';
import {
  teacherRecordSchema,
  teachersListQuerySchema,
} from '../../validation/teacherSchemas.js';
import { registerStandardTenantRoutes } from '../../lib/crudRouter.js';
import { teacherSetupConfigRoutes } from './teachers/teacherSetupConfigRoutes.js';
import { teacherLookupRoutes } from './teachers/teacherLookupRoutes.js';
import { teacherExportRoutes } from './teachers/teacherExportRoutes.js';
import { teacherOperationRoutes } from './teachers/teacherOperationRoutes.js';
import { teacherSoftDeleteRoutes } from './teachers/teacherSoftDeleteRoutes.js';
import { validateTeacherDynamic } from '../../services/teacherValidationService.js';
import {
  auditTeacher,
  sanitizeOneTeacherForUser,
  sanitizeTeachersForUser,
} from './teachers/teacherRouteHelpers.js';

/**
 * Server-first teacher resource routes (TanStack Query on FE).
 */
export default async function teachersRoutes(
  fastify: FastifyInstance,
  _options: FastifyPluginOptions,
): Promise<void> {
  fastify.addHook('preHandler', authenticateTenant);
  fastify.addHook('preHandler', requireTenantModule('teachers'));

  await fastify.register(teacherSetupConfigRoutes);
  await fastify.register(teacherLookupRoutes);
  await fastify.register(teacherExportRoutes);
  await fastify.register(teacherOperationRoutes);
  await fastify.register(teacherSoftDeleteRoutes);

  registerStandardTenantRoutes(fastify, {
    collection: 'teachers',
    schema: teacherRecordSchema,
    listQuerySchema: teachersListQuerySchema,
    defaultPageSize: TEACHERS_MODULE_MANIFEST.defaultPageSize,
    errorMessagePrefix: 'teachers',
    nameSingular: 'teacher',
    namePlural: 'teachers',
    loadPageFn: (query) => teacherUseCases.loadTeachersPage(query),
    responseTransform: async (result, user) => {
      const page = result as { teachers: Teacher[] };
      return {
        ...page,
        teachers: await sanitizeTeachersForUser(page.teachers, user as User),
      };
    },
    loadCountFn: () => teacherUseCases.countTeachers(),
    loadByIdFn: (id, includeDeleted) => teacherUseCases.loadTeacherById(id, includeDeleted),
    customPostRoute: true,
    updateFn: (id, data) => teacherUseCases.updateTeacherById(id, data),
    deleteFn: (id, userId, reason) => teacherUseCases.deleteTeacherById(id, userId, reason),
    restoreFn: (id) => teacherUseCases.restoreTeacherById(id),
    loadMetricsFn: () => teacherUseCases.loadTeachersCommandMetrics(),
    loadWidgetAggregatesFn: teacherUseCases.loadTeachersWidgetAggregates as unknown as (queries: unknown[]) => Promise<unknown>,
    loadByIdsFn: async (ids, request) => {
      const teachers = await teacherUseCases.loadTeachersByIds(ids);
      return sanitizeTeachersForUser(teachers, request.user as User);
    },
    loadLinkedContactIdsFn: (excludeId) => teacherUseCases.loadTeacherLinkedContactIds(excludeId),
    columnPreferencesObjectKey: TEACHERS_MODULE_MANIFEST.columnPreferencesObjectKey,
    validateDynamicFn: validateTeacherDynamic as never,
    canWriteDeletedCheck: (user) => canDeleteCollection(user, 'teachers'),
    buildSingleResponse: (item, user) =>
      sanitizeOneTeacherForUser(item as Teacher, user as User),
    buildRestoreResponse: async (restored, user) => ({
      success: true,
      teacher: await sanitizeOneTeacherForUser(restored as Teacher, user as User),
    }),
    onAfterUpdate: async (user, id) => {
      await auditTeacher(user, 'teacher.update', `Updated teacher ${id}`, id);
    },
    onAfterDelete: async (user, id, deletionReason) => {
      const reasonNote = deletionReason?.trim() ? ` — ${deletionReason.trim()}` : '';
      await auditTeacher(
        user,
        'teacher.soft_delete',
        `Soft-deleted teacher ${id}${reasonNote}`,
        id,
      );
    },
    onAfterRestore: async (user, id) => {
      await auditTeacher(user, 'teacher.restore', `Restored teacher ${id}`, id);
    },
  });
}
