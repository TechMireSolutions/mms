import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import {
  authenticatePlatform,
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

export default async function platformWorkspaceRoutes(
  fastify: FastifyInstance,
  _options: FastifyPluginOptions,
): Promise<void> {
  fastify.addHook('preHandler', authenticatePlatform);

  fastify.get('/', async (request, reply) => {
    const { platformUser } = request as PlatformAuthenticatedRequest;
    if (platformUser.role !== 'super_user') {
      return reply.status(403).send({
        type: 'forbidden',
        message: 'Only platform super-users can view workspaces',
      });
    }

    const workspaces = await listPlatformWorkspaces();
    return reply.send({ workspaces });
  });

  fastify.patch('/:subdomain', async (request, reply) => {
    const { platformUser } = request as PlatformAuthenticatedRequest;
    if (platformUser.role !== 'super_user') {
      return reply.status(403).send({
        type: 'forbidden',
        message: 'Only platform super-users can modify workspaces',
      });
    }

    const params = parseRequest(subdomainParamsSchema, request.params);
    if (!params.ok) return replyValidationError(reply, params.message);
    const body = parseRequest(workspaceEnabledPatchBodySchema, request.body);
    if (!body.ok) return replyValidationError(reply, body.message);

    const updated = await setWorkspaceEnabled(params.data.subdomain, body.data.enabled);
    if (!updated) {
      return reply.status(404).send({ type: 'not_found', message: 'Workspace not found' });
    }
    const workspaces = await listPlatformWorkspaces();
    const row = workspaces.find((ws) => ws.subdomain === updated.subdomain);
    return reply.send({ workspace: row });
  });

  fastify.delete('/:subdomain', async (request, reply) => {
    const { platformUser } = request as PlatformAuthenticatedRequest;
    if (platformUser.role !== 'super_user') {
      return reply.status(403).send({
        type: 'forbidden',
        message: 'Only platform super-users can delete workspaces',
      });
    }

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
      return reply.status(404).send({ type: 'not_found', message: 'Workspace not found' });
    }
    return reply.send({ deleted: true, subdomain: removed.subdomain });
  });
}
