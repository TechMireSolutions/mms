import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { AUDIT_RETENTION_REGIMES, roleHasPermission } from '@mms/shared';
import { getRequestTenant } from '../../../lib/tenantContext.js';
import { sendForbidden } from '../../../lib/httpErrors.js';
import {
  evaluateAuditRetentionPolicy,
  purgeExpiredCryptoShreddingKeys,
} from '../../../services/auditRetentionService.js';
import { executeSubjectErasure } from '../../../services/cryptoShreddingService.js';
import { parseRequest, replyValidationError } from '../../../lib/zodRequest.js';

const executeErasureBodySchema = z
  .object({
    subjectId: z.string().min(1),
    regime: z.enum(AUDIT_RETENTION_REGIMES),
    erasureType: z.enum(['CRYPTO_SHRED', 'REDACT_APPEND']),
    reason: z.string().optional(),
  })
  .strict();

const retentionEvaluateBodySchema = z
  .object({
    regime: z.enum(AUDIT_RETENTION_REGIMES),
    dryRun: z.boolean().default(true),
  })
  .strict();

export const auditPrivacyRoutes: FastifyPluginAsync = async (fastify) => {
  /**
   * POST /api/audit/erasure - Privacy / right-to-erasure GDPR execution.
   */
  fastify.post('/api/audit/erasure', async (request, reply) => {
    const user = request.user as { id?: string; role?: string };
    if (!roleHasPermission(user.role ?? '', 'analytics.view')) {
      return sendForbidden(reply);
    }
    const tenant = getRequestTenant();
    if (!tenant) {
      return reply.status(403).send({ type: 'forbidden', message: 'Tenant required' });
    }

    const parsedBody = parseRequest(executeErasureBodySchema, request.body);
    if (!parsedBody.ok) {
      return replyValidationError(reply, parsedBody.message);
    }
    const body = parsedBody.data;
    const userId = (request.user as { id?: string })?.id || 'system';

    const result = await executeSubjectErasure({
      subjectId: body.subjectId,
      workspaceSubdomain: tenant,
      regime: body.regime,
      erasureType: body.erasureType,
      requestedBy: userId,
      reason: body.reason,
    });

    return reply.send(result);
  });

  /**
   * POST /api/audit/retention/evaluate - Section 4: Regulatory regime retention evaluation & automated purge.
   */
  fastify.post('/api/audit/retention/evaluate', async (request, reply) => {
    const user = request.user as { id?: string; role?: string };
    if (!roleHasPermission(user.role ?? '', 'analytics.view')) {
      return sendForbidden(reply);
    }
    const tenant = getRequestTenant();
    if (!tenant) {
      return reply.status(403).send({ type: 'forbidden', message: 'Tenant required' });
    }

    const parsedBody = parseRequest(retentionEvaluateBodySchema, request.body);
    if (!parsedBody.ok) {
      return replyValidationError(reply, parsedBody.message);
    }

    const { regime, dryRun } = parsedBody.data;
    if (dryRun) {
      const evaluation = await evaluateAuditRetentionPolicy(regime);
      return reply.send(evaluation);
    }

    const purgeResult = await purgeExpiredCryptoShreddingKeys({ regime, dryRun: false });
    return reply.send(purgeResult);
  });
};
