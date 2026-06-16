import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import {
  getWorkspace,
  getWorkspaceBySubdomain,
  isSubdomainAvailable,
  listPublicWorkspaces,
  normalizeSubdomainInput,
  fetchPublicBrandingForSubdomain,
} from '../services/workspaceService.js';
import { getRequestTenant } from '../lib/tenantContext.js';

export default async function workspaceRoutes(
  fastify: FastifyInstance,
  _options: FastifyPluginOptions
): Promise<void> {
  fastify.get('/registry', async (_request, reply) => {
    if (getRequestTenant()) {
      return reply.status(404).send({ type: 'not_found', message: 'Not found' });
    }
    const workspaces = await listPublicWorkspaces();
    return reply.send({ workspaces });
  });

  fastify.get('/public-branding', async (_request, reply) => {
    const workspace = await getWorkspace();
    if (!workspace) {
      return reply.status(404).send({ type: 'not_found', message: 'No workspace configured' });
    }
    const branding = await fetchPublicBrandingForSubdomain(workspace.subdomain);
    return reply.send({ branding });
  });

  fastify.get('/current', async (_request, reply) => {
    const workspace = await getWorkspace();
    if (!workspace) {
      return reply.status(404).send({ type: 'not_found', message: 'No workspace configured' });
    }
    const branding = await fetchPublicBrandingForSubdomain(workspace.subdomain);
    return reply.send({ workspace, branding });
  });

  fastify.get<{ Params: { subdomain: string } }>(
    '/by-subdomain/:subdomain',
    async (request, reply) => {
      const subdomain = normalizeSubdomainInput(request.params.subdomain);
      const workspace = await getWorkspaceBySubdomain(subdomain);
      if (!workspace) {
        return reply.status(404).send({ type: 'not_found', message: 'Workspace not found' });
      }
      const branding = await fetchPublicBrandingForSubdomain(workspace.subdomain);
      return reply.send({
        workspace: {
          subdomain: workspace.subdomain,
          madrasaName: branding.madrasaName || workspace.madrasaName,
          tagline: branding.tagline || workspace.tagline,
        },
        branding,
      });
    }
  );

  fastify.get<{ Params: { subdomain: string } }>(
    '/subdomain-available/:subdomain',
    async (request, reply) => {
      const subdomain = normalizeSubdomainInput(request.params.subdomain);
      const available = await isSubdomainAvailable(subdomain);
      return reply.send({ subdomain, available });
    }
  );
}
