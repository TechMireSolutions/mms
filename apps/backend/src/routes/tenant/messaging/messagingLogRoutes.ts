import { randomUUID } from 'node:crypto';
import type { FastifyPluginAsync } from 'fastify';
import type { Message, User } from '@mms/shared';
import {
  messagingLogsQuerySchema,
  recordMessageLogsSchema,
} from '@mms/shared';
import { getRequestTenant } from '../../../lib/tenantContext.js';
import { sendDatabaseError, sendForbidden } from '../../../lib/httpErrors.js';
import { parseRequest, replyValidationError } from '../../../lib/zodRequest.js';
import {
  canClearMessagingLogs,
  canReadMessaging,
  canWriteMessaging,
} from '../../../services/rbacService.js';
import {
  clearAllMessageLogs,
  computeMessagingMetrics,
  loadFilteredMessageLogs,
  loadMessageLogs,
  recordMessageLogs,
} from '../../../services/messagingService.js';

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

/** Messaging log history, recording, clear, and metrics routes. */
export const messagingLogRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/logs', async (req, reply) => {
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

  fastify.post('/logs', async (req, reply) => {
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

  fastify.delete('/logs', async (req, reply) => {
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

  fastify.get('/metrics', async (req, reply) => {
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
};
