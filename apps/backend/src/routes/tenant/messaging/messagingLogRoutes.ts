import { createHash, randomUUID } from 'node:crypto';
import type { FastifyPluginAsync } from 'fastify';
import rateLimit from '@fastify/rate-limit';
import type { Message, MessageLogCreateDto, User } from '@mms/shared';
import {
  messagingLogsQuerySchema,
  messagingMetricsQuerySchema,
  recordMessageLogsSchema,
} from '@mms/shared';
import { getRequestTenant } from '../../../lib/tenantContext.js';
import { sendDatabaseError, sendForbidden } from '../../../lib/httpErrors.js';
import { MESSAGING_LOG_RATE_LIMIT } from '../../../lib/rateLimitConfig.js';
import { parseRequest, replyValidationError } from '../../../lib/zodRequest.js';
import { recordAudit } from '../../../services/auditService.js';
import {
  canClearMessagingLogs,
  canReadMessaging,
  canWriteMessaging,
} from '../../../services/rbacService.js';
import {
  authArtifactUserScopeKey,
  authArtifactWorkspaceScopeKey,
  deleteAuthArtifact,
  findAuthArtifactByLookupKey,
  tryClaimAuthArtifactByLookupKey,
  updateAuthArtifactPayload,
} from '../../../services/auth/authArtifactService.js';
import {
  clearAllMessageLogs,
  computeMessagingMetrics,
  loadFilteredMessageLogs,
  recordMessageLogs,
} from '../../../services/messagingService.js';

const MESSAGING_IDEMPOTENCY_TTL_MS = 24 * 60 * 60 * 1000;
const IDEMPOTENCY_PENDING_POLL_MS = 25;
const IDEMPOTENCY_PENDING_POLL_ATTEMPTS = 8;

/** `recorded: null` = in-flight claim; number = completed dispatch audit. */
type MessagingIdempotencyPayload = { recorded: number | null; bodyDigest: string };

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

function resolveIdempotencyKey(
  bodyKey: string | undefined,
  headerValue: string | string[] | undefined,
): string | undefined {
  const fromHeader = Array.isArray(headerValue) ? headerValue[0] : headerValue;
  const raw = (bodyKey ?? fromHeader ?? '').trim();
  return raw.length >= 8 ? raw.slice(0, 128) : undefined;
}

function messagingIdempotencyLookupKey(
  workspaceSubdomain: string,
  userId: string,
  clientKey: string,
): string {
  const digest = createHash('sha256')
    .update(`${workspaceSubdomain}\0${userId}\0${clientKey}`)
    .digest('hex');
  return `messaging_idem:${digest}`;
}

/** Digest of the dispatch logs body — bound to the idempotency key (`mms-api-interface` §6). */
function messagingDispatchBodyDigest(logs: MessageLogCreateDto[]): string {
  return createHash('sha256').update(JSON.stringify(logs)).digest('hex');
}

function completedRecorded(payload: MessagingIdempotencyPayload): number | undefined {
  return payload.recorded === null ? undefined : payload.recorded;
}

function idempotencyBodyMatches(
  payload: MessagingIdempotencyPayload,
  bodyDigest: string,
): boolean {
  return payload.bodyDigest === bodyDigest;
}

async function waitForCompletedIdempotency(
  lookupKey: string,
  bodyDigest: string,
): Promise<{ recorded: number } | { mismatch: true } | undefined> {
  for (let attempt = 0; attempt < IDEMPOTENCY_PENDING_POLL_ATTEMPTS; attempt += 1) {
    const existing = await findAuthArtifactByLookupKey<MessagingIdempotencyPayload>(
      'messaging_idempotency',
      lookupKey,
    );
    if (existing) {
      if (!idempotencyBodyMatches(existing.payload, bodyDigest)) {
        return { mismatch: true };
      }
      const recorded = completedRecorded(existing.payload);
      if (recorded !== undefined) return { recorded };
    }
    await new Promise((resolve) => setTimeout(resolve, IDEMPOTENCY_PENDING_POLL_MS));
  }
  return undefined;
}

function replyIdempotencyBodyMismatch(
  reply: { status: (code: number) => { send: (body: unknown) => unknown } },
) {
  return reply.status(409).send({
    type: 'conflict',
    message: 'Idempotency key reused with a different request body',
  });
}

/** Messaging log history, recording, clear, and metrics routes. */
export const messagingLogRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/logs', async (req, reply) => {
    const user = req.user as User;
    if (!canReadMessaging(user)) return sendForbidden(reply);
    const parsedQuery = parseRequest(messagingLogsQuerySchema, req.query);
    if (!parsedQuery.ok) return replyValidationError(reply, parsedQuery.message);
    if (parsedQuery.data.includeDeleted && !canClearMessagingLogs(user)) {
      return sendForbidden(reply);
    }
    const tenantSubdomain = getRequestTenant();
    if (!tenantSubdomain) {
      return reply.status(400).send({ type: 'validation_error', message: 'Tenant context required' });
    }
    try {
      const page = await loadFilteredMessageLogs(tenantSubdomain, parsedQuery.data);
      return reply.send(page);
    } catch (err) {
      return sendDatabaseError(reply, 'Failed to load message logs', err);
    }
  });

  await fastify.register(async (scoped) => {
    await scoped.register(rateLimit, MESSAGING_LOG_RATE_LIMIT);

    scoped.post('/logs', async (req, reply) => {
      const user = req.user as User;
      if (!canWriteMessaging(user)) return sendForbidden(reply);
      const parsed = parseRequest(recordMessageLogsSchema, req.body);
      if (!parsed.ok) return replyValidationError(reply, parsed.message);
      const tenantSubdomain = getRequestTenant();
      if (!tenantSubdomain) {
        return reply.status(400).send({ type: 'validation_error', message: 'Tenant context required' });
      }

      const idempotencyKey = resolveIdempotencyKey(
        parsed.data.idempotencyKey,
        req.headers['idempotency-key'],
      );
      const bodyDigest = messagingDispatchBodyDigest(parsed.data.logs);
      const lookupKey = idempotencyKey
        ? messagingIdempotencyLookupKey(tenantSubdomain, user.id, idempotencyKey)
        : undefined;
      const scopeKey = `${authArtifactWorkspaceScopeKey(tenantSubdomain)}:${authArtifactUserScopeKey(user.id)}`;

      try {
        if (lookupKey) {
          const existing = await findAuthArtifactByLookupKey<MessagingIdempotencyPayload>(
            'messaging_idempotency',
            lookupKey,
          );
          if (existing) {
            if (!idempotencyBodyMatches(existing.payload, bodyDigest)) {
              return replyIdempotencyBodyMismatch(reply);
            }
            const recorded = completedRecorded(existing.payload);
            if (recorded !== undefined) {
              return reply.send({ recorded });
            }
            const waited = await waitForCompletedIdempotency(lookupKey, bodyDigest);
            if (waited && 'mismatch' in waited) return replyIdempotencyBodyMismatch(reply);
            if (waited && 'recorded' in waited) return reply.send({ recorded: waited.recorded });
            return reply.status(409).send({
              type: 'conflict',
              message: 'Idempotent request still in progress',
            });
          }

          const claim = await tryClaimAuthArtifactByLookupKey<MessagingIdempotencyPayload>(
            'messaging_idempotency',
            { recorded: null, bodyDigest },
            MESSAGING_IDEMPOTENCY_TTL_MS,
            { lookupKey, scopeKey },
          );
          if (!claim.claimed) {
            const waited = await waitForCompletedIdempotency(lookupKey, bodyDigest);
            if (waited && 'mismatch' in waited) return replyIdempotencyBodyMismatch(reply);
            if (waited && 'recorded' in waited) return reply.send({ recorded: waited.recorded });
            return reply.status(409).send({
              type: 'conflict',
              message: 'Idempotent request still in progress',
            });
          }

          try {
            const normalized = normalizeDispatchLogs(user, parsed.data.logs);
            const recorded = await recordMessageLogs(tenantSubdomain, normalized);
            const payload: MessagingIdempotencyPayload = { recorded: recorded.length, bodyDigest };
            await updateAuthArtifactPayload(claim.id, payload);
            return reply.send({ recorded: recorded.length });
          } catch (err) {
            await deleteAuthArtifact(claim.id).catch(() => undefined);
            throw err;
          }
        }

        const normalized = normalizeDispatchLogs(user, parsed.data.logs);
        const recorded = await recordMessageLogs(tenantSubdomain, normalized);
        return reply.send({ recorded: recorded.length });
      } catch (err) {
        return sendDatabaseError(reply, 'Failed to record message logs', err);
      }
    });
  });

  fastify.delete('/logs', async (req, reply) => {
    const user = req.user as User;
    if (!canClearMessagingLogs(user)) return sendForbidden(reply);
    const tenantSubdomain = getRequestTenant();
    if (!tenantSubdomain) {
        return reply.status(400).send({ type: 'validation_error', message: 'Tenant context required' });
      }
    try {
      await clearAllMessageLogs(tenantSubdomain);
      await recordAudit({
        userId: user.id,
        userEmail: user.email,
        action: 'messaging.logs.clear',
        entityType: 'collection',
        entityId: 'message_logs',
        summary: 'Soft-archived all message logs from Reports',
      });
      return reply.send({ success: true });
    } catch (err) {
      return sendDatabaseError(reply, 'Failed to clear message logs', err);
    }
  });

  fastify.get('/metrics', async (req, reply) => {
    const user = req.user as User;
    if (!canReadMessaging(user)) return sendForbidden(reply);
    const parsedQuery = parseRequest(messagingMetricsQuerySchema, req.query);
    if (!parsedQuery.ok) return replyValidationError(reply, parsedQuery.message);
    const tenantSubdomain = getRequestTenant();
    if (!tenantSubdomain) {
      return reply.status(400).send({ type: 'validation_error', message: 'Tenant context required' });
    }
    try {
      const metrics = await computeMessagingMetrics(tenantSubdomain, {
        startDate: parsedQuery.data.startDate,
        endDate: parsedQuery.data.endDate,
      });
      return reply.send({ metrics });
    } catch (err) {
      return sendDatabaseError(reply, 'Failed to load messaging metrics', err);
    }
  });
};
