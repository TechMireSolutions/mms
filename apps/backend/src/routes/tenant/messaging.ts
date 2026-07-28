import { randomUUID } from 'node:crypto';
import { FastifyInstance, FastifyPluginOptions, FastifyRequest, FastifyReply } from 'fastify';
import { authenticateTenant } from '../../middleware/authenticate.js';
import { getRequestTenant } from '../../lib/tenantContext.js';
import { canReadMessaging, canWriteMessaging, canClearMessagingLogs } from '../../services/rbacService.js';
import { sendForbidden, sendDatabaseError } from '../../lib/httpErrors.js';
import {
  loadMessageTemplates,
  saveMessageTemplate,
  removeMessageTemplate,
  loadMessageLogs,
  loadFilteredMessageLogs,
  recordMessageLogs,
  clearAllMessageLogs,
  computeMessagingMetrics,
  loadMessagingRecipients,
  resolveMessagingContacts,
} from '../../services/messagingService.js';
import {
  type MessageTemplate,
  type Message,
  messageTemplateInputSchema,
  recordMessageLogsSchema,
  messagingLogsQuerySchema,
  messagingRecipientsQuerySchema,
  type User,
} from '@mms/shared';
import { parseRequest, replyValidationError } from '../../lib/zodRequest.js';
import { entityResolveBodySchema } from '../../validation/commonSchemas.js';

function normalizeDispatchLogs(user: User, logs: Array<{
  contactId: string | number;
  channel: 'sms' | 'whatsapp' | 'email';
  body: string;
  status?: 'sent' | 'failed' | 'skipped';
  subject?: string;
  category?: Message['category'];
  errorMessage?: string;
}>): Message[] {
  const sentAt = new Date().toISOString();
  return logs.map((log) => ({
    id: randomUUID(),
    userId: user.id,
    contactId: log.contactId,
    channel: log.channel,
    body: log.body,
    sentAt,
    status: log.status || 'sent',
    subject: log.subject,
    category: log.category || 'general',
    errorMessage: log.errorMessage,
  }));
}

export default async function messagingRoutes(
  fastify: FastifyInstance,
  _options: FastifyPluginOptions,
): Promise<void> {
  fastify.addHook('preHandler', authenticateTenant);

  // GET /api/messaging/recipients
  fastify.get('/recipients', async (req: FastifyRequest, reply: FastifyReply) => {
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

  // POST /api/messaging/contacts/resolve
  fastify.post('/contacts/resolve', async (req: FastifyRequest, reply: FastifyReply) => {
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

  // GET /api/messaging/templates
  fastify.get('/templates', async (req: FastifyRequest, reply: FastifyReply) => {
    const user = req.user as User;
    if (!canReadMessaging(user)) return sendForbidden(reply);
    try {
      const templates = await loadMessageTemplates();
      return reply.send({ templates });
    } catch (err) {
      return sendDatabaseError(reply, 'Failed to load message templates', err);
    }
  });

  // POST /api/messaging/templates
  fastify.post('/templates', async (req: FastifyRequest, reply: FastifyReply) => {
    const user = req.user as User;
    if (!canWriteMessaging(user)) return sendForbidden(reply);
    const parsed = parseRequest(messageTemplateInputSchema, req.body);
    if (!parsed.ok) return replyValidationError(reply, parsed.message);
    const tenantSubdomain = getRequestTenant();
    if (!tenantSubdomain) return reply.status(400).send({ message: 'Tenant context required' });

    const template: MessageTemplate = {
      id: parsed.data.id || `custom_${randomUUID()}`,
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

  // DELETE /api/messaging/templates/:id
  fastify.delete('/templates/:id', async (req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const user = req.user as User;
    if (!canWriteMessaging(user)) return sendForbidden(reply);
    const tenantSubdomain = getRequestTenant();
    if (!tenantSubdomain) return reply.status(400).send({ message: 'Tenant context required' });
    const { id } = req.params;
    try {
      await removeMessageTemplate(tenantSubdomain, id);
      return reply.send({ success: true });
    } catch (err) {
      return sendDatabaseError(reply, 'Failed to delete message template', err);
    }
  });

  // GET /api/messaging/logs
  fastify.get('/logs', async (req: FastifyRequest, reply: FastifyReply) => {
    const user = req.user as User;
    if (!canReadMessaging(user)) return sendForbidden(reply);
    const parsedQuery = parseRequest(messagingLogsQuerySchema, req.query);
    if (!parsedQuery.ok) return replyValidationError(reply, parsedQuery.message);
    const tenantSubdomain = getRequestTenant();
    try {
      if (tenantSubdomain) {
        const page = await loadFilteredMessageLogs(tenantSubdomain, parsedQuery.data);
        return reply.send(page);
      }
      const logs = await loadMessageLogs();
      return reply.send({
        logs,
        total: logs.length,
        page: 1,
        pageSize: Math.max(logs.length, 1),
        hasMore: false,
      });
    } catch (err) {
      return sendDatabaseError(reply, 'Failed to load message logs', err);
    }
  });

  // POST /api/messaging/logs
  fastify.post('/logs', async (req: FastifyRequest, reply: FastifyReply) => {
    const user = req.user as User;
    if (!canWriteMessaging(user)) return sendForbidden(reply);
    const parsed = parseRequest(recordMessageLogsSchema, req.body);
    if (!parsed.ok) return replyValidationError(reply, parsed.message);
    const tenantSubdomain = getRequestTenant();
    if (!tenantSubdomain) return reply.status(400).send({ message: 'Tenant context required' });

    try {
      const normalized = normalizeDispatchLogs(user, parsed.data.logs);
      const recorded = await recordMessageLogs(tenantSubdomain, normalized);
      return reply.send({ recorded: recorded.length });
    } catch (err) {
      return sendDatabaseError(reply, 'Failed to record message logs', err);
    }
  });

  // DELETE /api/messaging/logs
  fastify.delete('/logs', async (req: FastifyRequest, reply: FastifyReply) => {
    const user = req.user as User;
    if (!canClearMessagingLogs(user)) return sendForbidden(reply);
    const tenantSubdomain = getRequestTenant();
    if (!tenantSubdomain) return reply.status(400).send({ message: 'Tenant context required' });
    try {
      await clearAllMessageLogs(tenantSubdomain);
      return reply.send({ success: true });
    } catch (err) {
      return sendDatabaseError(reply, 'Failed to clear message logs', err);
    }
  });

  // GET /api/messaging/metrics
  fastify.get('/metrics', async (req: FastifyRequest, reply: FastifyReply) => {
    const user = req.user as User;
    if (!canReadMessaging(user)) return sendForbidden(reply);
    const tenantSubdomain = getRequestTenant();
    try {
      const metrics = await computeMessagingMetrics(tenantSubdomain || undefined);
      return reply.send({ metrics });
    } catch (err) {
      return sendDatabaseError(reply, 'Failed to load messaging metrics', err);
    }
  });
}
