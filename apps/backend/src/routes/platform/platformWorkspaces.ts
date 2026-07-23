import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import {
  authenticatePlatform,
  requireSuperUser,
  type PlatformAuthenticatedRequest,
} from '../../middleware/authenticatePlatform.js';
import {
  deleteWorkspace,
  listPlatformWorkspaces,
  setWorkspaceEnabled,
} from '../../services/workspaceService.js';
import { verifyPlatformUserPassword } from '../../services/platform/platformUserService.js';
import { subdomainParamsSchema } from '../../validation/commonSchemas.js';
import {
  workspaceDeleteBodySchema,
  workspaceEnabledPatchBodySchema,
} from '../../validation/platformSchemas.js';
import { parseRequest, replyValidationError } from '../../lib/zodRequest.js';
import { sendNotFound } from '../../lib/httpErrors.js';
import { insertPlatformActivityLog } from '../../db/repositories/platformActivityLogsRepository.js';

export default async function platformWorkspaceRoutes(
  fastify: FastifyInstance,
  _options: FastifyPluginOptions,
): Promise<void> {
  fastify.addHook('preHandler', authenticatePlatform);
  fastify.addHook('preHandler', requireSuperUser);

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

  fastify.delete('/:subdomain', async (request, reply) => {
    const { platformUser } = request as PlatformAuthenticatedRequest;
    const params = parseRequest(subdomainParamsSchema, request.params);
    if (!params.ok) return replyValidationError(reply, params.message);
    const body = parseRequest(workspaceDeleteBodySchema, request.body);
    if (!body.ok) return replyValidationError(reply, body.message);

    const passwordOk = await verifyPlatformUserPassword(platformUser.id, body.data.password);
    if (!passwordOk) {
      return reply.status(401).send({
        type: 'invalid_current_password',
        message: 'Current password is incorrect',
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
}

