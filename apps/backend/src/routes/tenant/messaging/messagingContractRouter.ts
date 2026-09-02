import type { FastifyPluginAsync } from 'fastify';
import type { User } from '@mms/shared';
import { rootContract, messagingRecipientsQuerySchema } from '@mms/shared';
import { initServer } from '@ts-rest/fastify';
import { canReadMessaging } from '../../../services/rbacService.js';
import { withTenant } from '../../../db/tenant-context.js';
import { getRequestTenant } from '../../../lib/tenantContext.js';
import { messagingUseCases } from '../../../messaging/use-cases/messagingUseCases.js';

const s = initServer();

function requireMessagingTenant(request: any): { id: string; subdomain: string } {
  const id = request.tenant?.id;
  const subdomain = getRequestTenant() || request.tenant?.subdomain;
  if (!id || !subdomain) {
    throw new Error('Tenant context required');
  }
  return { id: String(id), subdomain: String(subdomain) };
}

export const messagingContractRouter: FastifyPluginAsync = async (fastify) => {
  const router = s.router(rootContract.messaging, {
    listLogs: async ({ query, request }: any) => {
      const user = request.user as User;
      if (!canReadMessaging(user)) {
        return { status: 403 as const, body: { type: 'forbidden', message: 'Insufficient permissions' } };
      }
      try {
        const tenant = requireMessagingTenant(request);
        const result = await withTenant(tenant.id, () =>
          messagingUseCases.loadFilteredMessageLogs(tenant.subdomain, query),
          { readOnly: true },
        );
        return { status: 200 as const, body: result };
      } catch {
        return { status: 500 as const, body: { type: 'database_error', message: 'Failed to list message logs' } };
      }
    },
    listTemplates: async ({ request }: any) => {
      const user = request.user as User;
      if (!canReadMessaging(user)) {
        return { status: 403 as const, body: { type: 'forbidden', message: 'Insufficient permissions' } };
      }
      try {
        const templates = await withTenant(String(request.tenant?.id), () => messagingUseCases.loadMessageTemplates(), { readOnly: true });
        return { status: 200 as const, body: { templates } };
      } catch {
        return { status: 500 as const, body: { type: 'database_error', message: 'Failed to list messaging templates' } };
      }
    },
    listRecipients: async ({ query, request }: any) => {
      const user = request.user as User;
      if (!canReadMessaging(user)) {
        return { status: 403 as const, body: { type: 'forbidden', message: 'Insufficient permissions' } };
      }
      try {
        const parsed = messagingRecipientsQuerySchema.safeParse(query);
        const effectiveQuery = parsed.success ? parsed.data : query;
        const tenant = requireMessagingTenant(request);
        const result = await withTenant(tenant.id, () =>
          messagingUseCases.loadMessagingRecipients(tenant.subdomain, effectiveQuery),
          { readOnly: true },
        );
        return { status: 200 as const, body: result };
      } catch {
        return { status: 500 as const, body: { type: 'database_error', message: 'Failed to list recipients' } };
      }
    },
    // (typed as any because handler impls take loosely-typed ({ query, body, request }: any);
    //  tracked by the separate contract-router signature refactor)
  } as any);

  await fastify.register(s.plugin(router));
};
