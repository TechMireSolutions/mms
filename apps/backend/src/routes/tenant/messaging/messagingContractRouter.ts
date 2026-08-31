import type { FastifyPluginAsync } from 'fastify';
import type { User } from '@mms/shared';
import { rootContract, messagingRecipientsQuerySchema } from '@mms/shared';
import { initServer } from '@ts-rest/fastify';
import { canReadMessaging } from '../../../services/rbacService.js';
import { withTenant } from '../../../db/tenant-context.js';
import { getRequestTenant } from '../../../lib/tenantContext.js';
import {
  loadFilteredMessageLogs,
  loadMessageTemplates,
  loadMessagingRecipients,
} from '../../../services/messagingService.js';

const s = initServer();

export const messagingContractRouter: FastifyPluginAsync = async (fastify) => {
  const router = s.router(rootContract.messaging, {
    listLogs: async ({ query, request }: any) => {
      const user = request.user as User;
      if (!canReadMessaging(user)) {
        return { status: 403 as const, body: { type: 'forbidden', message: 'Insufficient permissions' } };
      }
      try {
        const subdomain = getRequestTenant() || request.tenant?.subdomain || (request.tenant?.id === 'ws-demo' ? 'demo' : String(request.tenant?.id ?? 'demo'));
        const result = await withTenant(String(request.tenant?.id), () =>
          loadFilteredMessageLogs(subdomain, query),
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
        const templates = await withTenant(String(request.tenant?.id), () => loadMessageTemplates(), { readOnly: true });
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
        const subdomain = getRequestTenant() || request.tenant?.subdomain || (request.tenant?.id === 'ws-demo' ? 'demo' : String(request.tenant?.id ?? 'demo'));
        const result = await withTenant(String(request.tenant?.id), () =>
          loadMessagingRecipients(subdomain, effectiveQuery),
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
