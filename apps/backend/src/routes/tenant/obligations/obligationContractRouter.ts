import type { FastifyPluginAsync } from 'fastify';
import type { User } from '@mms/shared';
import { rootContract } from '@mms/shared';
import { initServer } from '@ts-rest/fastify';
import { canReadCollection } from '../../../services/rbacService.js';
import { withTenant } from '../../../db/tenant-context.js';
import { obligationsUseCases } from '../../../obligations/use-cases/obligationsUseCases.js';

const s = initServer();

export const obligationContractRouter: FastifyPluginAsync = async (fastify) => {
  const router = s.router(rootContract.obligations, {
    listCollections: async ({ query, request }: any) => {
      const user = request.user as User;
      if (!canReadCollection(user, 'obligation_collections')) {
        return { status: 403 as const, body: { type: 'forbidden', message: 'Insufficient permissions' } };
      }
      try {
        const result = await withTenant(String(request.tenant?.id), () => obligationsUseCases.loadObligationCollections(query), { readOnly: true });
        return { status: 200 as const, body: result };
      } catch {
        return { status: 500 as const, body: { type: 'database_error', message: 'Failed to list collections' } };
      }
    },
    listTypes: async ({ request }: any) => {
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
    listMujtahids: async ({ request }: any) => {
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
    listDistributions: async ({ request }: any) => {
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
    // (typed as any because handler impls take loosely-typed ({ query, body, request }: any);
    //  tracked by the separate contract-router signature refactor)
  } as any);

  await fastify.register(s.plugin(router));
};
