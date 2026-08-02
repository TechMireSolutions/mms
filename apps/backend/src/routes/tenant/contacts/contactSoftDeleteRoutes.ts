import type { FastifyPluginAsync } from 'fastify';
import type { User } from '@mms/shared';
import { sendDatabaseError, sendForbidden, sendNotFound } from '../../../lib/httpErrors.js';
import { parseRequest, replyValidationError } from '../../../lib/zodRequest.js';
import {
  bulkRestoreContacts,
  bulkSoftDeleteContacts,
  restoreContactById,
  softDeleteContactById,
} from '../../../services/contactService.js';
import { canDeleteContacts } from '../../../services/rbacService.js';
import {
  contactBulkDeleteSchema,
  contactDeleteBodySchema,
} from '../../../validation/contactSchemas.js';
import { resourceIdParamsSchema } from '../../../validation/commonSchemas.js';
import { auditContact, sanitizeOneForUser } from './contactRouteHelpers.js';

/** Contact soft-delete, restore, and bulk trash routes. */
export const contactSoftDeleteRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.delete('/:id', async (request, reply) => {
    const user = request.user as User;
    if (!canDeleteContacts(user)) return sendForbidden(reply);

    const params = parseRequest(resourceIdParamsSchema, request.params);
    if (!params.ok) return replyValidationError(reply, params.message);

    const body = parseRequest(contactDeleteBodySchema, request.body ?? {});
    if (!body.ok) return replyValidationError(reply, body.message);
    const deletionReason = body.data.deletionReason;

    try {
      const deleted = await softDeleteContactById(params.data.id, user.id, deletionReason);
      if (!deleted) {
        return sendNotFound(reply, 'Contact not found');
      }
      const reasonNote = deletionReason?.trim() ? ` — ${deletionReason.trim()}` : '';
      await auditContact(user, 'contact.soft_delete', `Soft-deleted contact ${params.data.id}${reasonNote}`, params.data.id);
      return reply.send({ success: true });
    } catch {
      return sendDatabaseError(reply, 'Failed to delete contact');
    }
  });

  fastify.post('/:id/restore', async (request, reply) => {
    const user = request.user as User;
    if (!canDeleteContacts(user)) return sendForbidden(reply);

    const params = parseRequest(resourceIdParamsSchema, request.params);
    if (!params.ok) return replyValidationError(reply, params.message);

    try {
      const restored = await restoreContactById(params.data.id, user.id);
      if (!restored) {
        return sendNotFound(reply, 'Contact not found or not deleted');
      }
      await auditContact(user, 'contact.restore', `Restored contact ${params.data.id}`, params.data.id);
      return reply.send({ success: true, contact: await sanitizeOneForUser(restored, user) });
    } catch {
      return sendDatabaseError(reply, 'Failed to restore contact');
    }
  });

  fastify.post('/bulk-delete', async (request, reply) => {
    const user = request.user as User;
    if (!canDeleteContacts(user)) return sendForbidden(reply);

    const parsed = parseRequest(contactBulkDeleteSchema, request.body);
    if (!parsed.ok) return replyValidationError(reply, parsed.message);

    try {
      const ids = parsed.data.ids.map(String);
      const result = await bulkSoftDeleteContacts(ids, user.id, parsed.data.deletionReason);
      const reasonNote = parsed.data.deletionReason?.trim() ? ` — ${parsed.data.deletionReason.trim()}` : '';
      await auditContact(
        user,
        'contact.bulk_soft_delete',
        `Soft-deleted ${result.succeeded} contact(s); ${result.failed} failed${reasonNote}`,
      );
      return reply.send({ success: true, ...result });
    } catch {
      return sendDatabaseError(reply, 'Failed to bulk delete contacts');
    }
  });

  fastify.post('/bulk-restore', async (request, reply) => {
    const user = request.user as User;
    if (!canDeleteContacts(user)) return sendForbidden(reply);

    const parsed = parseRequest(contactBulkDeleteSchema, request.body);
    if (!parsed.ok) return replyValidationError(reply, parsed.message);

    try {
      const ids = parsed.data.ids.map(String);
      const result = await bulkRestoreContacts(ids, user.id);
      await auditContact(
        user,
        'contact.bulk_restore',
        `Restored ${result.succeeded} contact(s); ${result.failed} failed`,
      );
      return reply.send({ success: true, ...result });
    } catch {
      return sendDatabaseError(reply, 'Failed to bulk restore contacts');
    }
  });
};
