import type { FastifyPluginAsync } from 'fastify';
import type { User, WidgetQuery } from '@mms/shared';
import { rootContract } from '@mms/shared';
import { initServer } from '@ts-rest/fastify';
import { canReadCollection, canDeleteCollection } from '../../../services/rbacService.js';
import { withTenant } from '../../../db/tenant-context.js';
import {
  loadDistributionsPage,
  loadDenoms,
  loadBatches,
  loadRedemptions,
  bulkSoftDeleteDistributions,
  bulkRestoreDistributions,
  loadHasanatWidgetAggregates,
} from '../../../services/hasanatService.js';

const s = initServer();

export const hasanatContractRouter: FastifyPluginAsync = async (fastify) => {
  const router = s.router(rootContract.hasanat, {
    listDistributions: async ({ query, request }: any) => {
      const user = request.user as User;
      if (!canReadCollection(user, 'hasanat_distributions')) {
        return { status: 403 as const, body: { type: 'forbidden', message: 'Insufficient permissions' } };
      }
      const includeDeleted = query?.includeDeleted === 'true' || query?.includeDeleted === true;
      if (includeDeleted && !canDeleteCollection(user, 'hasanat_distributions')) {
        return { status: 403 as const, body: { type: 'forbidden', message: 'Insufficient permissions' } };
      }
      try {
        const result = await withTenant(String(request.tenant?.id), () => loadDistributionsPage({ ...query, includeDeleted }), { readOnly: true });
        return { status: 200 as const, body: result };
      } catch {
        return { status: 500 as const, body: { type: 'database_error', message: 'Failed to list distributions' } };
      }
    },
    bulkDeleteDistributions: async ({ body, request }: any) => {
      const user = request.user as User;
      if (!canDeleteCollection(user, 'hasanat_distributions')) {
        return { status: 403 as const, body: { type: 'forbidden', message: 'Insufficient permissions' } };
      }
      try {
        const result = await withTenant(String(request.tenant?.id), () =>
          bulkSoftDeleteDistributions(body.ids.map(String), String(user.id), body.deletionReason),
          { readOnly: false },
        );
        return { status: 200 as const, body: { success: true, ...result } };
      } catch {
        return { status: 500 as const, body: { type: 'database_error', message: 'Failed to bulk delete distributions' } };
      }
    },
    bulkRestoreDistributions: async ({ body, request }: any) => {
      const user = request.user as User;
      if (!canDeleteCollection(user, 'hasanat_distributions')) {
        return { status: 403 as const, body: { type: 'forbidden', message: 'Insufficient permissions' } };
      }
      try {
        const result = await withTenant(String(request.tenant?.id), () =>
          bulkRestoreDistributions(body.ids.map(String)),
          { readOnly: false },
        );
        return { status: 200 as const, body: { success: true, ...result } };
      } catch {
        return { status: 500 as const, body: { type: 'database_error', message: 'Failed to bulk restore distributions' } };
      }
    },
    listDenoms: async ({ request }: any) => {
      const user = request.user as User;
      if (!canReadCollection(user, 'hasanat_denoms')) {
        return { status: 403 as const, body: { type: 'forbidden', message: 'Insufficient permissions' } };
      }
      try {
        const result = await withTenant(String(request.tenant?.id), () => loadDenoms(), { readOnly: true });
        return { status: 200 as const, body: result };
      } catch {
        return { status: 500 as const, body: { type: 'database_error', message: 'Failed to list denominations' } };
      }
    },
    listBatches: async ({ request }: any) => {
      const user = request.user as User;
      if (!canReadCollection(user, 'hasanat_batches')) {
        return { status: 403 as const, body: { type: 'forbidden', message: 'Insufficient permissions' } };
      }
      try {
        const result = await withTenant(String(request.tenant?.id), () => loadBatches(), { readOnly: true });
        return { status: 200 as const, body: result };
      } catch {
        return { status: 500 as const, body: { type: 'database_error', message: 'Failed to list batches' } };
      }
    },
    listRedemptions: async ({ request }: any) => {
      const user = request.user as User;
      if (!canReadCollection(user, 'hasanat_redemptions')) {
        return { status: 403 as const, body: { type: 'forbidden', message: 'Insufficient permissions' } };
      }
      try {
        const result = await withTenant(String(request.tenant?.id), () => loadRedemptions(), { readOnly: true });
        return { status: 200 as const, body: result };
      } catch {
        return { status: 500 as const, body: { type: 'database_error', message: 'Failed to list redemptions' } };
      }
    },
    widgetAggregates: async ({ body, request }: any) => {
      const user = request.user as User;
      if (!canReadCollection(user, 'hasanat_distributions')) {
        return { status: 403 as const, body: { type: 'forbidden', message: 'Insufficient permissions' } };
      }
      try {
        const result = await withTenant(String(request.tenant?.id), () => loadHasanatWidgetAggregates(body.widgets as WidgetQuery[]), { readOnly: true });
        return { status: 200 as const, body: result };
      } catch (error) {
        return { status: 500 as const, body: { type: 'database_error', message: 'Failed to load widget aggregates' } };
      }
    },
    // (typed as any because handler impls take loosely-typed ({ query, body, request }: any);
    //  tracked by the separate contract-router signature refactor)
  } as any);

  await fastify.register(s.plugin(router));
};
