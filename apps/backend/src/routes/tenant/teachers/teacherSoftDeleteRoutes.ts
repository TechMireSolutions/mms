import type { FastifyPluginAsync } from 'fastify';
import { registerSoftDeletableBulkTrashRoutes } from '../../../lib/crudBulkRoutes.js';
import { teachersBulkIdsSchema } from '../../../validation/teacherSchemas.js';
import {
  bulkSoftDeleteTeachers,
  bulkRestoreTeachers,
} from '../../../services/teacherService.js';
import { auditTeacher } from './teacherRouteHelpers.js';

/** Teachers bulk soft-delete / restore (single delete/restore via standard CRUD routes). */
export const teacherSoftDeleteRoutes: FastifyPluginAsync = async (fastify) => {
  registerSoftDeletableBulkTrashRoutes(fastify, {
    collection: 'teachers',
    errorMessagePrefix: 'teachers',
    bulkBodySchema: teachersBulkIdsSchema,
    bulkDeleteFn: bulkSoftDeleteTeachers,
    bulkRestoreFn: (ids) => bulkRestoreTeachers(ids),
    onAfterBulkDelete: async (user, result, deletionReason) => {
      const reasonNote = deletionReason?.trim() ? ` — ${deletionReason.trim()}` : '';
      await auditTeacher(
        user,
        'teacher.bulk_soft_delete',
        `Soft-deleted ${result.succeeded} teacher(s); ${result.failed} failed${reasonNote}`,
      );
    },
    onAfterBulkRestore: async (user, result) => {
      await auditTeacher(
        user,
        'teacher.bulk_restore',
        `Restored ${result.succeeded} teacher(s); ${result.failed} failed`,
      );
    },
  });
};
