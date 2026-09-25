import type { FastifyPluginAsync } from 'fastify';
import { registerSoftDeletableBulkTrashRoutes } from '../../../lib/crudBulkRoutes.js';
import { bulkIdsBodySchema as facultyBulkIdsSchema } from '@mms/shared';
import { facultyUseCases } from '../../../faculty/use-cases/facultyUseCases.js';
import { auditFaculty } from './facultyRouteHelpers.js';

/** Faculty bulk soft-delete / restore (single delete/restore via standard CRUD routes). */
export const facultySoftDeleteRoutes: FastifyPluginAsync = async (fastify) => {
  registerSoftDeletableBulkTrashRoutes(fastify, {
    collection: 'faculty',
    errorMessagePrefix: 'faculty',
    bulkBodySchema: facultyBulkIdsSchema,
    bulkDeleteFn: (ids, user, reason) => facultyUseCases.bulkSoftDeleteFaculty(ids, user, reason),
    bulkRestoreFn: (ids, userId) => facultyUseCases.bulkRestoreFaculty(ids, userId),
    onAfterBulkDelete: async (user, result, deletionReason) => {
      const reasonNote = deletionReason?.trim() ? ` — ${deletionReason.trim()}` : '';
      await auditFaculty(
        user,
        'faculty.bulk_soft_delete',
        `Soft-deleted ${result.succeeded} faculty member(s); ${result.failed} failed${reasonNote}`,
      );
    },
    onAfterBulkRestore: async (user, result) => {
      await auditFaculty(
        user,
        'faculty.bulk_restore',
        `Restored ${result.succeeded} faculty member(s); ${result.failed} failed`,
      );
    },
  });
};
