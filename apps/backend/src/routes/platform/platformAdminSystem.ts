import type { FastifyInstance, FastifyPluginOptions } from 'fastify';
import rateLimit from '@fastify/rate-limit';
import { type MigrateAndRestartAccepted } from '@mms/shared';
import {
  migrateAndRestartSchema,
  platformActivityLogsQuerySchema,
} from '../../validation/platformSchemas.js';
import {
  authenticatePlatform,
  requireMainDomain,
  requireSuperUser,
  type PlatformAuthenticatedRequest,
} from '../../middleware/authenticatePlatform.js';
import { parseRequest, replyValidationError } from '../../lib/zodRequest.js';
import { sendInvalidCurrentPassword } from '../../lib/httpErrors.js';
import { AUTH_RATE_LIMIT } from '../../lib/rateLimitConfig.js';
import {
  insertPlatformActivityLog,
  listPlatformActivityLogs,
} from '../../db/repositories/platformActivityLogsRepository.js';
import { verifyPlatformUserPassword } from '../../services/platform/platformUserService.js';
import {
  isMigrateRestartInFlight,
  isRemoteMigrateRestartEnabled,
  MIGRATE_RESTART_DELAY_MS,
  scheduleMigrateAndRestart,
} from '../../services/platform/platformAdminService.js';

/**
 * Platform apex system ops — full initDb (DDL + data migrations) + PM2 reload.
 * Restricted to `super_user` with password step-up and explicit env opt-in.
 */
export default async function platformAdminSystemRoutes(
  fastify: FastifyInstance,
  _options: FastifyPluginOptions,
): Promise<void> {
  fastify.addHook('preHandler', requireMainDomain);

  await fastify.register(async function platformMigrateRestartRateLimited(inner) {
    await inner.register(rateLimit, AUTH_RATE_LIMIT);

    inner.post(
      '/migrate-and-restart',
      { preHandler: [authenticatePlatform, requireSuperUser] },
      async (request, reply) => {
        if (!isRemoteMigrateRestartEnabled()) {
          return reply.status(403).send({
            type: 'remote_migrate_disabled',
            message:
              'Remote migrate-and-restart is disabled. Set PLATFORM_ALLOW_REMOTE_MIGRATE_RESTART=true on the server.',
          });
        }

        const parsed = parseRequest(migrateAndRestartSchema, request.body ?? {});
        if (!parsed.ok) return replyValidationError(reply, parsed.message);

        const { platformUser } = request as PlatformAuthenticatedRequest;
        const passwordOk = await verifyPlatformUserPassword(platformUser.id, parsed.data.password);
        if (!passwordOk) {
          return sendInvalidCurrentPassword(reply);
        }

        if (isMigrateRestartInFlight()) {
          return reply.status(409).send({
            type: 'migrate_restart_in_progress',
            message: 'A migrate-and-restart is already in progress.',
          });
        }

        const scheduled = scheduleMigrateAndRestart({
          userId: platformUser.id,
          userEmail: platformUser.email,
          ipAddress: request.ip,
        });

        if (!scheduled) {
          return reply.status(409).send({
            type: 'migrate_restart_in_progress',
            message: 'A migrate-and-restart is already in progress.',
          });
        }

        await insertPlatformActivityLog({
          userId: platformUser.id,
          userEmail: platformUser.email,
          action: 'migrate_and_restart',
          targetResource: 'system',
          metadataMessage: `Scheduled migrate-and-restart (delay=${MIGRATE_RESTART_DELAY_MS}ms)`,
          ipAddress: request.ip,
        });

        // Acknowledge before migrate/reload so the client is not dropped mid-response.
        const body: MigrateAndRestartAccepted = {
          success: true,
          accepted: true,
          message:
            'Migrate and restart accepted. Database migrations will run, then the backend will reload shortly.',
          delayMs: MIGRATE_RESTART_DELAY_MS,
        };
        return reply.status(200).send(body);
      },
    );

    inner.get(
      '/activity-logs',
      { preHandler: [authenticatePlatform, requireSuperUser] },
      async (request, reply) => {
        const parsed = parseRequest(platformActivityLogsQuerySchema, request.query ?? {});
        if (!parsed.ok) return replyValidationError(reply, parsed.message);
        const { limit, offset } = parsed.data;
        const logs = await listPlatformActivityLogs(limit, offset);
        return reply.send({ logs });
      },
    );
  });
}
