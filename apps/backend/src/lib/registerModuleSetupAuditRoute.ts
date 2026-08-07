import type { FastifyInstance } from 'fastify';
import type { ZodTypeAny } from 'zod';
import type { Permission, User } from '@mms/shared';
import { roleHasPermission } from '@mms/shared';
import { sendForbidden } from './httpErrors.js';
import { parseRequest, replyValidationError } from './zodRequest.js';
import { moduleSetupAuditBodySchema } from '../validation/csvExportBodySchema.js';
import { recordAudit } from '../services/auditService.js';

export type RegisterModuleSetupAuditRouteOptions = {
  setupWritePermission: Permission;
  auditAction: string;
  bodySchema?: ZodTypeAny;
};

/**
 * Register POST `/setup-audit` for module Setup Fields/Preferences (and Contacts sync).
 */
export function registerModuleSetupAuditRoute(
  fastify: FastifyInstance,
  options: RegisterModuleSetupAuditRouteOptions,
): void {
  const bodySchema = options.bodySchema ?? moduleSetupAuditBodySchema;

  fastify.post('/setup-audit', async (request, reply) => {
    const user = request.user as User;
    if (!roleHasPermission(user.role, options.setupWritePermission)) {
      return sendForbidden(reply);
    }

    const parsed = parseRequest(bodySchema, request.body);
    if (!parsed.ok) return replyValidationError(reply, parsed.message);

    const data = parsed.data as { area: string; summary: string };
    await recordAudit({
      userId: user.id,
      userEmail: user.email,
      action: options.auditAction,
      entityType: 'collection',
      entityId: `setup:${data.area}`,
      summary: data.summary,
    });
    return reply.send({ success: true });
  });
}
