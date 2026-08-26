import crypto from 'node:crypto';
import rateLimit from '@fastify/rate-limit';
import type { FastifyPluginAsync } from 'fastify';
import type { BackgroundJobRecord, User } from '@mms/shared';
import { MESSAGING_MODULE_MANIFEST, messagingCsvExportBodySchema } from '@mms/shared';
import { MESSAGING_LOG_RATE_LIMIT } from '../../../lib/rateLimitConfig.js';
import { getRequestTenant } from '../../../lib/tenantContext.js';
import { sendForbidden } from '../../../lib/httpErrors.js';
import { parseRequest, replyValidationError } from '../../../lib/zodRequest.js';
import { recordAudit } from '../../../services/auditService.js';
import {
  enqueueBackgroundJob,
  getUserBackgroundJob,
  getUserBackgroundJobPayload,
} from '../../../services/backgroundJobWorkerService.js';
import { canWriteMessaging } from '../../../services/rbacService.js';

function messagingExportBodyDigest(input: {
  query?: unknown;
  filename?: string;
  label?: string;
}): string {
  return crypto.hash('sha256', JSON.stringify({
    query: input.query ?? {},
    filename: input.filename ?? null,
    label: input.label ?? null,
  }), 'hex');
}

/** Queues messaging logs CSV export as a background job. */
export const messagingExportRoutes: FastifyPluginAsync = async (fastify) => {
  await fastify.register(async (scoped) => {
    await scoped.register(rateLimit, MESSAGING_LOG_RATE_LIMIT);

    scoped.post('/export/csv', async (request, reply) => {
      const user = request.user as User;
      if (!canWriteMessaging(user)) return sendForbidden(reply);

      const parsed = parseRequest(messagingCsvExportBodySchema, request.body);
      if (!parsed.ok) return replyValidationError(reply, parsed.message);

      const tenant = getRequestTenant();
      if (!tenant) {
        return reply.status(400).send({ type: 'validation_error', message: 'Tenant context required' });
      }
      const userId = String(user.id);
      const jobId = parsed.data.idempotencyKey?.trim() || crypto.randomUUID();
      const bodyDigest = messagingExportBodyDigest({
        query: parsed.data.query,
        filename: parsed.data.filename,
        label: parsed.data.label,
      });

      const existing = await getUserBackgroundJob(userId, jobId);
      if (existing) {
        const payload = await getUserBackgroundJobPayload(userId, jobId);
        const existingDigest = typeof payload?.bodyDigest === 'string' ? payload.bodyDigest : undefined;
        if (!existingDigest || existingDigest !== bodyDigest) {
          return reply.status(409).send({
            type: 'conflict',
            message: 'Idempotency key reused with a different export body',
          });
        }
        return reply.status(202).send({ job: existing });
      }

      const label = parsed.data.label?.trim() || 'Exporting message logs…';
      const runningJob: BackgroundJobRecord = {
        id: jobId,
        moduleId: MESSAGING_MODULE_MANIFEST.moduleId,
        kind: 'export',
        status: 'running',
        label,
        createdAt: new Date().toISOString(),
      };

      const job = await enqueueBackgroundJob(tenant, userId, runningJob, {
        query: parsed.data.query,
        filename: parsed.data.filename,
        label,
        bodyDigest,
      });

      await recordAudit({
        userId: user.id,
        userEmail: user.email,
        action: 'messaging.export.queue',
        entityType: 'collection',
        entityId: jobId,
        summary: `Queued messaging export "${label}"`,
      });

      return reply.status(202).send({ job });
    });
  });
};
