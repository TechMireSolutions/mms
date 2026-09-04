import type { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { platformSettingsUpdateSchema } from '../../validation/platformSchemas.js';
import {
  authenticatePlatform,
  requirePlatformPermission,
  type PlatformAuthenticatedRequest,
} from '../../middleware/authenticatePlatform.js';
import {
  getPlatformSettings,
  updatePlatformSettings,
} from '../../services/platform/platformSettingsService.js';
import { parseRequest, replyValidationError } from '../../lib/zodRequest.js';
import { insertPlatformActivityLog } from '../../db/repositories/platformActivityLogsRepository.js';

export default async function platformSettingsRoutes(
  fastify: FastifyInstance,
  _options: FastifyPluginOptions,
): Promise<void> {

  fastify.get(
    '/',
    { preHandler: [authenticatePlatform, requirePlatformPermission('settings')] },
    async (_request, reply) => {
      const settings = getPlatformSettings();
      return reply.send({ settings });
    },
  );

  fastify.put(
    '/',
    { preHandler: [authenticatePlatform, requirePlatformPermission('settings')] },
    async (request, reply) => {
      const parsed = parseRequest(platformSettingsUpdateSchema, request.body ?? {});
      if (!parsed.ok) return replyValidationError(reply, parsed.message);

      const settings = await updatePlatformSettings(parsed.data);
      const { platformUser } = request as PlatformAuthenticatedRequest;
      await insertPlatformActivityLog({
        userId: platformUser.id,
        userEmail: platformUser.email,
        action: 'update_settings',
        targetResource: 'settings',
        ipAddress: request.ip,
      });

      return reply.send({ settings, success: true });
    },
  );
}
