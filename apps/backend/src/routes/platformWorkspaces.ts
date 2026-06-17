import { FastifyInstance, FastifyPluginOptions, FastifySchema } from 'fastify';
import { authenticatePlatform } from '../middleware/authenticatePlatform.js';
import { listPlatformWorkspaces, setWorkspaceEnabled } from '../services/workspaceService.js';

interface PatchBody {
  enabled?: boolean;
}

const patchSchema: FastifySchema = {
  body: {
    type: 'object',
    required: ['enabled'],
    properties: {
      enabled: { type: 'boolean' },
    },
  },
};

export default async function platformWorkspaceRoutes(
  fastify: FastifyInstance,
  _options: FastifyPluginOptions,
): Promise<void> {
  fastify.addHook('preHandler', authenticatePlatform);

  fastify.get('/', async (_request, reply) => {
    const workspaces = await listPlatformWorkspaces();
    return reply.send({ workspaces });
  });

  fastify.patch<{ Params: { subdomain: string }; Body: PatchBody }>(
    '/:subdomain',
    { schema: patchSchema },
    async (request, reply) => {
      const updated = await setWorkspaceEnabled(request.params.subdomain, request.body.enabled!);
      if (!updated) {
        return reply.status(404).send({ type: 'not_found', message: 'Workspace not found' });
      }
      const workspaces = await listPlatformWorkspaces();
      const row = workspaces.find((ws) => ws.subdomain === updated.subdomain);
      return reply.send({ workspace: row });
    },
  );
}
