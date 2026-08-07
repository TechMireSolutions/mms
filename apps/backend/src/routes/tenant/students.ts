import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { authenticateTenant } from '../../middleware/authenticate.js';
import { canDeleteCollection, canReadCollection } from '../../services/rbacService.js';
import {
  createStudent,
  deleteStudentById,
  restoreStudentById,
  loadStudentsPage,
  loadStudentsByIds,
  loadStudentById,
  loadStudentLinkedContactIds,
  loadStudentsWidgetAggregates,
  loadStudentsCommandMetrics,
  countStudents,
  updateStudentById,
  loadStudentFieldUsageCount,
  loadStudentFieldUsageCounts,
} from '../../services/studentService.js';
import {
  STUDENTS_MODULE_MANIFEST,
  studentRecordSchema,
} from '@mms/shared';
import {
  studentsListQuerySchema,
} from '../../validation/studentSchemas.js';
import { validateStudentDynamic } from '../../services/studentValidationService.js';
import { registerStandardTenantRoutes } from '../../lib/crudRouter.js';
import { registerFieldUsageRoutes } from '../../lib/registerFieldUsageRoutes.js';
import { studentSetupConfigRoutes } from './students/studentSetupConfigRoutes.js';
import { studentLookupRoutes } from './students/studentLookupRoutes.js';
import { studentExportRoutes } from './students/studentExportRoutes.js';
import { studentOperationRoutes } from './students/studentOperationRoutes.js';
import { studentSoftDeleteRoutes } from './students/studentSoftDeleteRoutes.js';
import { auditStudent } from './students/studentRouteHelpers.js';

/**
 * Server-first student resource routes (TanStack Query on FE).
 */
export default async function studentsRoutes(
  fastify: FastifyInstance,
  _options: FastifyPluginOptions,
): Promise<void> {
  fastify.addHook('preHandler', authenticateTenant);

  await fastify.register(studentSetupConfigRoutes);
  await fastify.register(studentLookupRoutes);
  await fastify.register(studentExportRoutes);
  await fastify.register(studentOperationRoutes);
  await fastify.register(studentSoftDeleteRoutes);

  registerFieldUsageRoutes(fastify, {
    canRead: (user) => canReadCollection(user, 'students'),
    loadCount: loadStudentFieldUsageCount,
    loadCounts: loadStudentFieldUsageCounts,
  });

  registerStandardTenantRoutes(fastify, {
    collection: 'students',
    schema: studentRecordSchema as never,
    listQuerySchema: studentsListQuerySchema,
    defaultPageSize: STUDENTS_MODULE_MANIFEST.defaultPageSize,
    errorMessagePrefix: 'students',
    nameSingular: 'student',
    namePlural: 'students',
    loadPageFn: (query) => loadStudentsPage(query),
    loadCountFn: countStudents,
    loadByIdFn: loadStudentById as never,
    createFn: createStudent as never,
    updateFn: updateStudentById as never,
    deleteFn: deleteStudentById,
    restoreFn: (id, _userId) => restoreStudentById(id),
    loadMetricsFn: loadStudentsCommandMetrics,
    loadWidgetAggregatesFn: loadStudentsWidgetAggregates as unknown as (queries: unknown[]) => Promise<unknown>,
    loadByIdsFn: loadStudentsByIds as never,
    loadLinkedContactIdsFn: loadStudentLinkedContactIds,
    columnPreferencesObjectKey: STUDENTS_MODULE_MANIFEST.columnPreferencesObjectKey,
    validateDynamicFn: validateStudentDynamic as never,
    canWriteDeletedCheck: (user) => canDeleteCollection(user, 'students'),
    onAfterCreate: async (user, item) => {
      const id =
        item && typeof item === 'object' && 'id' in item
          ? String((item as { id: unknown }).id)
          : 'students';
      await auditStudent(user, 'student.create', `Created student ${id}`, id);
    },
    onAfterUpdate: async (user, id) => {
      await auditStudent(user, 'student.update', `Updated student ${id}`, id);
    },
    onAfterDelete: async (user, id, deletionReason) => {
      const reasonNote = deletionReason?.trim() ? ` — ${deletionReason.trim()}` : '';
      await auditStudent(
        user,
        'student.soft_delete',
        `Soft-deleted student ${id}${reasonNote}`,
        id,
      );
    },
    onAfterRestore: async (user, id) => {
      await auditStudent(user, 'student.restore', `Restored student ${id}`, id);
    },
  });
}
