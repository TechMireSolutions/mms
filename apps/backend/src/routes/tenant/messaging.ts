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
  recordMessageLogs,
  clearAllMessageLogs,
  computeMessagingMetrics,
} from '../../services/messagingService.js';
import { type MessageTemplate, type Message, messageTemplateInputSchema, recordMessageLogsSchema, type User } from '@mms/shared';
import { parseRequest, replyValidationError } from '../../lib/zodRequest.js';

export default async function messagingRoutes(
  fastify: FastifyInstance,
  _options: FastifyPluginOptions,
): Promise<void> {
  fastify.addHook('preHandler', authenticateTenant);

  // GET /api/messaging/templates
  fastify.get('/templates', async (req: FastifyRequest, reply: FastifyReply) => {
    const user = req.user as User;
    if (!canReadMessaging(user)) return sendForbidden(reply);
    try {
      const templates = await loadMessageTemplates();
      return reply.send({ templates });
    } catch (err) {
      return sendDatabaseError(reply, String(err));
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
      id: parsed.data.id || `custom_${Date.now()}`,
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
      return sendDatabaseError(reply, String(err));
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
      return sendDatabaseError(reply, String(err));
    }
  });

  // GET /api/messaging/logs
  fastify.get('/logs', async (req: FastifyRequest, reply: FastifyReply) => {
    const user = req.user as User;
    if (!canReadMessaging(user)) return sendForbidden(reply);
    try {
      const logs = await loadMessageLogs();
      return reply.send({ logs });
    } catch (err) {
      return sendDatabaseError(reply, String(err));
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
      const recorded = await recordMessageLogs(tenantSubdomain, parsed.data.logs as Message[]);
      return reply.send({ recorded: recorded.length });
    } catch (err) {
      return sendDatabaseError(reply, String(err));
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
      return sendDatabaseError(reply, String(err));
    }
  });

  // GET /api/messaging/metrics
  fastify.get('/metrics', async (req: FastifyRequest, reply: FastifyReply) => {
    const user = req.user as User;
    if (!canReadMessaging(user)) return sendForbidden(reply);
    try {
      const metrics = await computeMessagingMetrics();
      return reply.send({ metrics });
    } catch (err) {
      return sendDatabaseError(reply, String(err));
    }
  });
}
