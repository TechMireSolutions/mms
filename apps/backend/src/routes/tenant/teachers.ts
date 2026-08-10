import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { authenticateTenant } from '../../middleware/authenticate.js';
import { canDeleteCollection, canReadCollection } from '../../services/rbacService.js';
import {
  createTeacher,
  deleteTeacherById,
  restoreTeacherById,
  loadTeachersPage,
  loadTeachersByIds,
  loadTeacherById,
  loadTeacherLinkedContactIds,
  loadTeachersWidgetAggregates,
  loadTeachersCommandMetrics,
  countTeachers,
  updateTeacherById,
} from '../../services/teacherService.js';
import { TEACHERS_MODULE_MANIFEST } from '@mms/shared';
import {
  teacherRecordSchema,
  teachersListQuerySchema,
} from '../../validation/teacherSchemas.js';
import { registerStandardTenantRoutes } from '../../lib/crudRouter.js';
import { registerFieldUsageRoutes } from '../../lib/registerFieldUsageRoutes.js';
import { teacherSetupConfigRoutes } from './teachers/teacherSetupConfigRoutes.js';
import { teacherLookupRoutes } from './teachers/teacherLookupRoutes.js';
import { teacherExportRoutes } from './teachers/teacherExportRoutes.js';
import { teacherOperationRoutes } from './teachers/teacherOperationRoutes.js';
import { teacherSoftDeleteRoutes } from './teachers/teacherSoftDeleteRoutes.js';
import {
  loadTeacherFieldUsageCount,
  loadTeacherFieldUsageCounts,
} from '../../services/teacherService.js';
import { validateTeacherDynamic } from '../../services/teacherValidationService.js';
import { auditTeacher } from './teachers/teacherRouteHelpers.js';

/**
 * Server-first teacher resource routes (TanStack Query on FE).
 */
export default async function teachersRoutes(
  fastify: FastifyInstance,
  _options: FastifyPluginOptions,
): Promise<void> {
  fastify.addHook('preHandler', authenticateTenant);

  await fastify.register(teacherSetupConfigRoutes);
  await fastify.register(teacherLookupRoutes);
  await fastify.register(teacherExportRoutes);
  await fastify.register(teacherOperationRoutes);
  await fastify.register(teacherSoftDeleteRoutes);

  registerFieldUsageRoutes(fastify, {
    canRead: (user) => canReadCollection(user, 'teachers'),
    loadCount: loadTeacherFieldUsageCount,
    loadCounts: loadTeacherFieldUsageCounts,
  });

  registerStandardTenantRoutes(fastify, {
    collection: 'teachers',
    schema: teacherRecordSchema,
    listQuerySchema: teachersListQuerySchema,
    defaultPageSize: TEACHERS_MODULE_MANIFEST.defaultPageSize,
    errorMessagePrefix: 'teachers',
    nameSingular: 'teacher',
    namePlural: 'teachers',
    loadPageFn: (query) => loadTeachersPage(query),
    loadCountFn: countTeachers,
    loadByIdFn: loadTeacherById,
    createFn: createTeacher,
    updateFn: updateTeacherById,
    deleteFn: deleteTeacherById,
    restoreFn: restoreTeacherById,
    loadMetricsFn: loadTeachersCommandMetrics,
    loadWidgetAggregatesFn: loadTeachersWidgetAggregates as unknown as (queries: unknown[]) => Promise<unknown>,
    loadByIdsFn: loadTeachersByIds,
    loadLinkedContactIdsFn: loadTeacherLinkedContactIds,
    columnPreferencesObjectKey: TEACHERS_MODULE_MANIFEST.columnPreferencesObjectKey,
    validateDynamicFn: validateTeacherDynamic as never,
    canWriteDeletedCheck: (user) => canDeleteCollection(user, 'teachers'),
    onAfterCreate: async (user, item) => {
      const id =
        item && typeof item === 'object' && 'id' in item
          ? String((item as { id: unknown }).id)
          : 'teachers';
      await auditTeacher(user, 'teacher.create', `Created teacher ${id}`, id);
    },
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
