import type { FastifyPluginAsync } from 'fastify';
import type { User } from '@mms/shared';
import { obligationContract } from '@mms/shared';
import { initServer } from '@ts-rest/fastify';
import type { ContractRouteArgs } from '../../../lib/contractRouterTypes.js';
import { canReadCollection } from '../../../services/rbacService.js';
import { withTenant } from '../../../db/tenant-context.js';
import { obligationsUseCases } from '../../../obligations/use-cases/obligationsUseCases.js';

const s = initServer();

export const obligationContractRouter: FastifyPluginAsync = async (fastify) => {
  const router = s.router(obligationContract, {
    listCollections: async ({ query, request }: ContractRouteArgs<typeof obligationContract['listCollections']>): Promise<unknown> => {
      const user = request.user as User;
      if (!canReadCollection(user, 'obligation_collections')) {
        return { status: 403 as const, body: { type: 'forbidden', message: 'Insufficient permissions' } };
      }
      try {
        const result = await withTenant(String(request.tenant?.id), () => obligationsUseCases.loadObligationCollections(query as Parameters<typeof obligationsUseCases.loadObligationCollections>[0]), { readOnly: true });
        return { status: 200 as const, body: result };
      } catch {
        return { status: 500 as const, body: { type: 'database_error', message: 'Failed to list collections' } };
      }
    },
    listTypes: async ({ request }: ContractRouteArgs<typeof obligationContract['listTypes']>): Promise<unknown> => {
      const user = request.user as User;
      if (!canReadCollection(user, 'obligation_types')) {
        return { status: 403 as const, body: { type: 'forbidden', message: 'Insufficient permissions' } };
      }
      try {
        const result = await withTenant(String(request.tenant?.id), () => obligationsUseCases.loadObligationTypes(), { readOnly: true });
        return { status: 200 as const, body: result };
      } catch {
        return { status: 500 as const, body: { type: 'database_error', message: 'Failed to list obligation types' } };
      }
    },
    listMujtahids: async ({ request }: ContractRouteArgs<typeof obligationContract['listMujtahids']>): Promise<unknown> => {
      const user = request.user as User;
      if (!canReadCollection(user, 'mujtahids')) {
        return { status: 403 as const, body: { type: 'forbidden', message: 'Insufficient permissions' } };
      }
      try {
        const result = await withTenant(String(request.tenant?.id), () => obligationsUseCases.loadMujtahids(), { readOnly: true });
        return { status: 200 as const, body: result };
      } catch {
        return { status: 500 as const, body: { type: 'database_error', message: 'Failed to list mujtahids' } };
      }
    },
    listDistributions: async ({ request }: ContractRouteArgs<typeof obligationContract['listDistributions']>): Promise<unknown> => {
      const user = request.user as User;
      if (!canReadCollection(user, 'obligation_distributions')) {
        return { status: 403 as const, body: { type: 'forbidden', message: 'Insufficient permissions' } };
      }
      try {
        const result = await withTenant(String(request.tenant?.id), () => obligationsUseCases.loadObligationDistributions(), { readOnly: true });
        return { status: 200 as const, body: result };
      } catch {
        return { status: 500 as const, body: { type: 'database_error', message: 'Failed to list distributions' } };
      }
    },
  } as unknown as Parameters<typeof s.router>[1]);

  await fastify.register(s.plugin(router));
};
