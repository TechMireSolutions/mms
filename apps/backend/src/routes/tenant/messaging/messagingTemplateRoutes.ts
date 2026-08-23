import { randomUUID } from 'node:crypto';
import type { FastifyPluginAsync } from 'fastify';
import type { MessageTemplate, User } from '@mms/shared';
import { messageTemplateInputSchema } from '@mms/shared';
import { getRequestTenant } from '../../../lib/tenantContext.js';
import { sendDatabaseError, sendForbidden, sendNotFound } from '../../../lib/httpErrors.js';
import { parseRequest, replyValidationError } from '../../../lib/zodRequest.js';
import { canWriteMessaging } from '../../../services/rbacService.js';
import {
  getMessageTemplateById,
  removeMessageTemplate,
  saveMessageTemplate,
} from '../../../services/messagingService.js';

/** Messaging template list/create/delete routes. */
export const messagingTemplateRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.post('/templates', async (req, reply) => {
    const user = req.user as User;
    if (!canWriteMessaging(user)) return sendForbidden(reply);
    const parsed = parseRequest(messageTemplateInputSchema, req.body);
    if (!parsed.ok) return replyValidationError(reply, parsed.message);
    const tenantSubdomain = getRequestTenant();
    if (!tenantSubdomain) {
      return reply.status(400).send({ type: 'validation_error', message: 'Tenant context required' });
    }

    const requestedId = parsed.data.id?.trim();
    let templateId: string;
    if (!requestedId) {
      templateId = `custom_${randomUUID()}`;
    } else if (!requestedId.startsWith('custom_')) {
      return reply.status(400).send({
        type: 'validation_error',
        message: 'System templates cannot be overwritten',
      });
    } else {
      try {
        const existing = await getMessageTemplateById(tenantSubdomain, requestedId);
        if (!existing) {
          return sendNotFound(reply, 'Template not found');
        }
      } catch (err) {
        return sendDatabaseError(reply, 'Failed to load message template', err);
      }
      templateId = requestedId;
    }

    const template: MessageTemplate = {
      id: templateId,
      label: parsed.data.label,
      body: parsed.data.body,
      category: parsed.data.category,
      channel: parsed.data.channel,
      updatedAt: new Date().toISOString(),
    };

    try {
      const saved = await saveMessageTemplate(tenantSubdomain, template);
      return reply.send({ template: saved });
    } catch (err) {
      return sendDatabaseError(reply, 'Failed to save message template', err);
    }
  });

  fastify.delete('/templates/:id', async (req, reply) => {
    const user = req.user as User;
    if (!canWriteMessaging(user)) return sendForbidden(reply);
    const tenantSubdomain = getRequestTenant();
    if (!tenantSubdomain) {
      return reply.status(400).send({ type: 'validation_error', message: 'Tenant context required' });
    }
    const { id } = req.params as { id: string };
    if (!id.startsWith('custom_')) {
      return reply.status(400).send({
        type: 'validation_error',
        message: 'System templates cannot be deleted',
      });
    }
    try {
      await removeMessageTemplate(tenantSubdomain, id);
      return reply.send({ success: true });
    } catch (err) {
      return sendDatabaseError(reply, 'Failed to delete message template', err);
    }
  });
};
