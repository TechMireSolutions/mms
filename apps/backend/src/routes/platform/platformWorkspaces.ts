import type { FastifyInstance, FastifyPluginOptions } from 'fastify';
import rateLimit from '@fastify/rate-limit';
import {
  authenticatePlatform,
  requirePlatformPermission,
  requirePlatformSuperUser,
  type PlatformAuthenticatedRequest,
} from '../../middleware/authenticatePlatform.js';
import {
  deleteWorkspace,
  getWorkspaceGrantedModules,
  listPlatformWorkspaces,
  setWorkspaceEmailVerification,
  setWorkspaceEnabled,
  updateWorkspaceModules,
} from '../../services/workspaceService.js';
import { verifyPlatformUserPassword } from '../../services/platform/platformUserService.js';
import { subdomainParamsSchema } from '../../validation/commonSchemas.js';
import {
  workspaceDeleteBodySchema,
  workspaceEnabledPatchBodySchema,
  platformWorkspaceModulesPatchBodySchema,
  workspaceEmailVerificationPatchBodySchema,
} from '../../validation/platformSchemas.js';
import { parseRequest, replyValidationError } from '../../lib/zodRequest.js';
import { sendInvalidCurrentPassword, sendNotFound } from '../../lib/httpErrors.js';
import { insertPlatformActivityLog } from '../../db/repositories/platformActivityLogsRepository.js';
import { AUTH_RATE_LIMIT } from '../../lib/rateLimitConfig.js';
import { blockTenant, unblockTenant } from '../../services/session.service.js';

export default async function platformWorkspaceRoutes(
  fastify: FastifyInstance,
  _options: FastifyPluginOptions,
): Promise<void> {
  fastify.addHook('preHandler', authenticatePlatform);
  fastify.addHook('preHandler', requirePlatformPermission('workspaces'));

  fastify.get('/', async (_request, reply) => {
    const workspaces = await listPlatformWorkspaces();
    return reply.send({ workspaces });
  });

  fastify.patch('/:subdomain', async (request, reply) => {
    const { platformUser } = request as PlatformAuthenticatedRequest;
    const params = parseRequest(subdomainParamsSchema, request.params);
    if (!params.ok) return replyValidationError(reply, params.message);
    const body = parseRequest(workspaceEnabledPatchBodySchema, request.body);
    if (!body.ok) return replyValidationError(reply, body.message);

    const updated = await setWorkspaceEnabled(params.data.subdomain, body.data.enabled);
    if (!updated) {
      return sendNotFound(reply, 'Workspace not found');
    }

    if (body.data.enabled) {
      await unblockTenant(params.data.subdomain);
    } else {
      await blockTenant(params.data.subdomain);
    }

    await insertPlatformActivityLog({
      userId: platformUser.id,
      userEmail: platformUser.email,
      action: 'toggle_workspace',
      targetResource: 'workspace',
      targetId: params.data.subdomain,
      metadataMessage: `Set enabled=${body.data.enabled}`,
      ipAddress: request.ip,
    });

    const workspaces = await listPlatformWorkspaces();
    const row = workspaces.find((ws) => ws.subdomain === updated.subdomain);
    return reply.send({ workspace: row });
  });

  fastify.get('/:subdomain/modules', async (request, reply) => {
    const params = parseRequest(subdomainParamsSchema, request.params);
    if (!params.ok) return replyValidationError(reply, params.message);

    const modules = await getWorkspaceGrantedModules(params.data.subdomain);
    return reply.send({ modules });
  });

  fastify.patch('/:subdomain/modules', async (request, reply) => {
    const { platformUser } = request as PlatformAuthenticatedRequest;
    const params = parseRequest(subdomainParamsSchema, request.params);
    if (!params.ok) return replyValidationError(reply, params.message);

    const body = parseRequest(platformWorkspaceModulesPatchBodySchema, request.body);
    if (!body.ok) return replyValidationError(reply, body.message);

    const result = await updateWorkspaceModules(params.data.subdomain, body.data.modules);

    await insertPlatformActivityLog({
      userId: platformUser.id,
      userEmail: platformUser.email,
      action: 'update_workspace_modules',
      targetResource: 'workspace',
      targetId: params.data.subdomain,
      metadataMessage: `modules=[${body.data.modules.join(',')}]`,
      ipAddress: request.ip,
    });

    return reply.send({ success: true, modules: result.modules });
  });

  fastify.patch('/:subdomain/email-verification', async (request, reply) => {
    const { platformUser } = request as PlatformAuthenticatedRequest;
    const params = parseRequest(subdomainParamsSchema, request.params);
    if (!params.ok) return replyValidationError(reply, params.message);

    const body = parseRequest(workspaceEmailVerificationPatchBodySchema, request.body);
    if (!body.ok) return replyValidationError(reply, body.message);

    const result = await setWorkspaceEmailVerification(
      params.data.subdomain,
      body.data.requireEmailVerification,
    );
    if (!result) return sendNotFound(reply, 'Workspace not found');

    await insertPlatformActivityLog({
      userId: platformUser.id,
      userEmail: platformUser.email,
      action: 'update_workspace_email_verification',
      targetResource: 'workspace',
      targetId: params.data.subdomain,
      metadataMessage: `requireEmailVerification=${body.data.requireEmailVerification}`,
      ipAddress: request.ip,
    });

    return reply.send({
      success: true,
      subdomain: result.subdomain,
      requireEmailVerification: result.requireEmailVerification,
    });
  });

  fastify.post('/:subdomain/users/:userId/verify-email', async (request, reply) => {
    const { platformUser } = request as PlatformAuthenticatedRequest;
    const { subdomain, userId } = request.params as { subdomain: string; userId: string };
    if (!subdomain || !userId) return replyValidationError(reply, 'Invalid parameters');

    const {
      verifyTenantUserEmailRow,
      findTenantUserRowById,
    } = await import('../../db/repositories/tenantUserRepository.js');

    // Validate the user actually belongs to the given workspace subdomain.
    const existing = await findTenantUserRowById(userId);
    if (!existing || existing.workspaceSubdomain !== subdomain) {
      return sendNotFound(reply, 'User not found in workspace');
    }

    const ok = await verifyTenantUserEmailRow(userId);
    if (!ok) return sendNotFound(reply, 'User not found in workspace');

    await insertPlatformActivityLog({
      userId: platformUser.id,
      userEmail: platformUser.email,
      action: 'verify_tenant_user_email',
      targetResource: 'workspace_user',
      targetId: `${subdomain}:${userId}`,
      metadataMessage: `Verified tenant user ${userId} in ${subdomain}`,
      ipAddress: request.ip,
    });

    return reply.send({ success: true });
  });

  await fastify.register(async function platformWorkspaceDeleteRateLimited(inner) {
    await inner.register(rateLimit, AUTH_RATE_LIMIT);

    // Permanently purges all tenant-scoped data, so it is gated on the super-user
    // role (like reset-database / migrate-and-restart), not just the grantable
    // `workspaces` permission.
    inner.delete('/:subdomain', { preHandler: requirePlatformSuperUser() }, async (request, reply) => {
      const { platformUser } = request as PlatformAuthenticatedRequest;
      const params = parseRequest(subdomainParamsSchema, request.params);
      if (!params.ok) return replyValidationError(reply, params.message);
      const body = parseRequest(workspaceDeleteBodySchema, request.body);
      if (!body.ok) return replyValidationError(reply, body.message);

      const passwordOk = await verifyPlatformUserPassword(platformUser.id, body.data.password);
      if (!passwordOk) {
        return sendInvalidCurrentPassword(reply);
      }

      if (body.data.confirmSubdomain.trim().toLowerCase() !== params.data.subdomain.toLowerCase()) {
        return reply.status(400).send({
          type: 'validation_error',
          message: 'Confirmation subdomain does not match the workspace being deleted',
        });
      }

      const removed = await deleteWorkspace(params.data.subdomain);
      if (!removed) {
        return sendNotFound(reply, 'Workspace not found');
      }

      await blockTenant(params.data.subdomain);

      await insertPlatformActivityLog({
        userId: platformUser.id,
        userEmail: platformUser.email,
        action: 'delete_workspace',
        targetResource: 'workspace',
        targetId: params.data.subdomain,
        ipAddress: request.ip,
      });

      return reply.send({ deleted: true, subdomain: removed.subdomain });
    });
  });
}
