import type { FastifyPluginAsync } from 'fastify';
import type { Contact, User } from '@mms/shared';
import { registerResourceRoutes } from '../../../lib/crudResourceRoutes.js';
import { registerSoftDeletableBulkTrashRoutes } from '../../../lib/crudBulkRoutes.js';
import {
  bulkRestoreContacts,
  bulkSoftDeleteContacts,
  ContactUniqueFieldError,
  restoreContactById,
  softDeleteContactById,
} from '../../../services/contactService.js';
import { canDeleteContacts } from '../../../services/rbacService.js';
import {
  contactBulkDeleteSchema,
  contactRecordSchema,
} from '../../../validation/contactSchemas.js';
import { auditContact, sanitizeOneForUser } from './contactRouteHelpers.js';

/** Contact soft-delete, restore, and bulk trash routes. */
export const contactSoftDeleteRoutes: FastifyPluginAsync = async (fastify) => {
  registerResourceRoutes(fastify, {
    collection: 'contacts',
    schema: contactRecordSchema as never,
    nameSingular: 'contact',
    namePlural: 'contacts',
    customGetRoute: true,
    customGetSingleRoute: true,
    customPostRoute: true,
    customPutRoute: true,
    canDelete: canDeleteContacts,
    deleteFn: softDeleteContactById,
    restoreFn: (id, userId) => restoreContactById(id, userId),
    onAfterDelete: async (user, id, deletionReason) => {
      const reasonNote = deletionReason?.trim() ? ` — ${deletionReason.trim()}` : '';
      await auditContact(
        user,
        'contact.soft_delete',
        `Soft-deleted contact ${id}${reasonNote}`,
        id,
      );
    },
    onAfterRestore: async (user, id) => {
      await auditContact(user, 'contact.restore', `Restored contact ${id}`, id);
    },
    buildRestoreResponse: async (restored, user) => ({
      success: true,
      contact: await sanitizeOneForUser(restored as Contact, user as User),
    }),
    mapRestoreError: (error) => {
      if (error instanceof ContactUniqueFieldError) {
        return {
          statusCode: 400,
          body: {
            type: 'validation_error',
            message: error.message,
            errors: error.errors,
          },
        };
      }
      return null;
    },
  });

  registerSoftDeletableBulkTrashRoutes(fastify, {
    collection: 'contacts',
    errorMessagePrefix: 'contacts',
    bulkBodySchema: contactBulkDeleteSchema,
    canDelete: canDeleteContacts,
    bulkDeleteFn: bulkSoftDeleteContacts,
    bulkRestoreFn: bulkRestoreContacts,
    onAfterBulkDelete: async (user, result, deletionReason) => {
      const reasonNote = deletionReason?.trim() ? ` — ${deletionReason.trim()}` : '';
      await auditContact(
        user,
        'contact.bulk_soft_delete',
        `Soft-deleted ${result.succeeded} contact(s); ${result.failed} failed${reasonNote}`,
      );
    },
    onAfterBulkRestore: async (user, result) => {
      await auditContact(
        user,
        'contact.bulk_restore',
        `Restored ${result.succeeded} contact(s); ${result.failed} failed`,
      );
    },
  });
};
