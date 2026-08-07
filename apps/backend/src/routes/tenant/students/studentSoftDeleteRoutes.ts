import type { FastifyPluginAsync } from 'fastify';
import { registerSoftDeletableBulkTrashRoutes } from '../../../lib/crudBulkRoutes.js';
import {
  studentsBulkIdsSchema,
} from '../../../validation/studentSchemas.js';
import {
  bulkSoftDeleteStudents,
  bulkRestoreStudents,
} from '../../../services/studentService.js';
import { auditStudent } from './studentRouteHelpers.js';

/** Students bulk soft-delete / restore (single delete/restore via standard CRUD routes). */
export const studentSoftDeleteRoutes: FastifyPluginAsync = async (fastify) => {
  registerSoftDeletableBulkTrashRoutes(fastify, {
    collection: 'students',
    errorMessagePrefix: 'students',
    bulkBodySchema: studentsBulkIdsSchema,
    bulkDeleteFn: bulkSoftDeleteStudents,
    bulkRestoreFn: (ids) => bulkRestoreStudents(ids),
    onAfterBulkDelete: async (user, result, deletionReason) => {
      const reasonNote = deletionReason?.trim() ? ` — ${deletionReason.trim()}` : '';
      await auditStudent(
        user,
        'student.bulk_soft_delete',
        `Soft-deleted ${result.succeeded} student(s); ${result.failed} failed${reasonNote}`,
      );
    },
    onAfterBulkRestore: async (user, result) => {
      await auditStudent(
        user,
        'student.bulk_restore',
        `Restored ${result.succeeded} student(s); ${result.failed} failed`,
      );
    },
  });
};
