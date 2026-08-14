import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import rateLimit from '@fastify/rate-limit';
import {
  authenticatePlatform,
  requirePlatformPermission,
  type PlatformAuthenticatedRequest,
} from '../../middleware/authenticatePlatform.js';
import {
  deleteWorkspace,
  listPlatformWorkspaces,
  setWorkspaceEnabled,
} from '../../services/workspaceService.js';
import { verifyPlatformUserPassword } from '../../services/platform/platformUserService.js';
import { runWithTenant } from '../../lib/tenantContext.js';
import { getObject, saveObject } from '../../db/database.js';
import { SYSTEM_MODULES } from '@mms/shared';
import { subdomainParamsSchema } from '../../validation/commonSchemas.js';
import {
  workspaceDeleteBodySchema,
  workspaceEnabledPatchBodySchema,
  platformWorkspaceModulesPatchBodySchema,
} from '../../validation/platformSchemas.js';
import { parseRequest, replyValidationError } from '../../lib/zodRequest.js';
import { sendInvalidCurrentPassword, sendNotFound } from '../../lib/httpErrors.js';
import { insertPlatformActivityLog } from '../../db/repositories/platformActivityLogsRepository.js';
import { AUTH_RATE_LIMIT } from '../../lib/rateLimitConfig.js';

export default async function platformWorkspaceRoutes(
  fastify: FastifyInstance,
  _options: FastifyPluginOptions,
): Promise<void> {
  fastify.addHook('preHandler', authenticatePlatform);
  fastify.addHook('preHandler', requirePlatformPermission('workspaces'));

  fastify.get('/', async (request, reply) => {
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

    await insertPlatformActivityLog({
      userId: platformUser.id,
      userEmail: platformUser.email,
      action: 'toggle_workspace',
      details: { subdomain: params.data.subdomain, enabled: body.data.enabled },
      ipAddress: request.ip,
    });

    const workspaces = await listPlatformWorkspaces();
    const row = workspaces.find((ws) => ws.subdomain === updated.subdomain);
    return reply.send({ workspace: row });
  });

  fastify.get('/:subdomain/modules', async (request, reply) => {
    const params = parseRequest(subdomainParamsSchema, request.params);
    if (!params.ok) return replyValidationError(reply, params.message);
    
    return runWithTenant(params.data.subdomain, async () => {
      const platformSettings = (await getObject('platform_settings')) as any || {};
      const grantedModules = platformSettings.grantedModules || {};
      
      const modules = Object.entries(grantedModules)
        .filter(([_, granted]) => granted)
        .map(([id]) => id);
        
      return reply.send({ modules });
    });
  });

  fastify.patch('/:subdomain/modules', async (request, reply) => {
    const { platformUser } = request as PlatformAuthenticatedRequest;
    const params = parseRequest(subdomainParamsSchema, request.params);
    if (!params.ok) return replyValidationError(reply, params.message);
    
    const body = parseRequest(platformWorkspaceModulesPatchBodySchema, request.body);
    if (!body.ok) return replyValidationError(reply, body.message);

    return runWithTenant(params.data.subdomain, async () => {
      const platformSettings = (await getObject('platform_settings')) as any || {};
      const globalSettings = (await getObject('global_settings')) as any || {};
      
      const grantedModules: Record<string, boolean> = {};
      const enabledModules: Record<string, boolean> = globalSettings.enabledModules || {};

      for (const mod of SYSTEM_MODULES) {
        if (mod.required) {
          grantedModules[mod.id] = true;
          enabledModules[mod.id] = true;
        } else {
          const isGranted = body.data.modules.includes(mod.id);
          const wasGranted = platformSettings.grantedModules?.[mod.id] === true;
          grantedModules[mod.id] = isGranted;
          
          if (!isGranted) {
            enabledModules[mod.id] = false;
          } else if (!wasGranted) {
            enabledModules[mod.id] = true;
          }
        }
      }

      await saveObject('platform_settings', {
        ...platformSettings,
        grantedModules,
      });

      await saveObject('global_settings', {
        ...globalSettings,
        enabledModules,
      });

      await insertPlatformActivityLog({
        userId: platformUser.id,
        userEmail: platformUser.email,
        action: 'update_workspace_modules',
        details: { subdomain: params.data.subdomain, modules: body.data.modules },
        ipAddress: request.ip,
      });

      return reply.send({ success: true, modules: body.data.modules });
    });
  });

  await fastify.register(async function platformWorkspaceDeleteRateLimited(inner) {
    await inner.register(rateLimit, AUTH_RATE_LIMIT);

    inner.delete('/:subdomain', async (request, reply) => {
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

      await insertPlatformActivityLog({
        userId: platformUser.id,
        userEmail: platformUser.email,
        action: 'delete_workspace',
        details: { subdomain: params.data.subdomain },
        ipAddress: request.ip,
      });

      return reply.send({ deleted: true, subdomain: removed.subdomain });
    });
  });
}
