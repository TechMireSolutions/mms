import type { FastifyPluginAsync } from 'fastify';
import type { User } from '@mms/shared';
import { messagingRecipientsQuerySchema } from '@mms/shared';
import { getRequestTenant } from '../../../lib/tenantContext.js';
import { sendDatabaseError, sendForbidden } from '../../../lib/httpErrors.js';
import { parseRequest, replyValidationError } from '../../../lib/zodRequest.js';
import { entityResolveBodySchema } from '../../../validation/commonSchemas.js';
import { canReadMessaging } from '../../../services/rbacService.js';
import {
  loadMessagingRecipients,
  resolveMessagingContacts,
} from '../../../services/messagingService.js';

/** Messaging recipient directory and contact resolve routes. */
export const messagingRecipientRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/recipients', async (req, reply) => {
    const user = req.user as User;
    if (!canReadMessaging(user)) return sendForbidden(reply);
    const parsedQuery = parseRequest(messagingRecipientsQuerySchema, req.query);
    if (!parsedQuery.ok) return replyValidationError(reply, parsedQuery.message);
    const tenantSubdomain = getRequestTenant();
    if (!tenantSubdomain) return reply.status(400).send({ message: 'Tenant context required' });
    try {
      const page = await loadMessagingRecipients(tenantSubdomain, parsedQuery.data);
      return reply.send(page);
    } catch (err) {
      return sendDatabaseError(reply, 'Failed to load messaging recipients', err);
    }
  });

  fastify.post('/contacts/resolve', async (req, reply) => {
    const user = req.user as User;
    if (!canReadMessaging(user)) return sendForbidden(reply);
    const parsed = parseRequest(entityResolveBodySchema, req.body);
    if (!parsed.ok) return replyValidationError(reply, parsed.message);
    const tenantSubdomain = getRequestTenant();
    if (!tenantSubdomain) return reply.status(400).send({ message: 'Tenant context required' });
    try {
      const contacts = await resolveMessagingContacts(tenantSubdomain, parsed.data.ids);
      return reply.send({ contacts });
    } catch (err) {
      return sendDatabaseError(reply, 'Failed to resolve messaging contacts', err);
    }
  });
};
