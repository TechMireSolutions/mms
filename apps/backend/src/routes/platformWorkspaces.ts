import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { authenticatePlatform } from '../middleware/authenticatePlatform.js';
import { listPlatformWorkspaces, setWorkspaceEnabled } from '../services/workspaceService.js';
import { subdomainParamsSchema } from '../validation/commonSchemas.js';
import { workspaceEnabledPatchBodySchema } from '../validation/platformSchemas.js';
import { parseRequest, replyValidationError } from '../lib/zodRequest.js';

export default async function platformWorkspaceRoutes(
  fastify: FastifyInstance,
  _options: FastifyPluginOptions,
): Promise<void> {
  fastify.addHook('preHandler', authenticatePlatform);

  fastify.get('/', async (_request, reply) => {
    const workspaces = await listPlatformWorkspaces();
    return reply.send({ workspaces });
  });

  fastify.patch('/:subdomain', async (request, reply) => {
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
}
