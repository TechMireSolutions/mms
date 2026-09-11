import type { FastifyPluginAsync } from 'fastify';
import { isQueryFlagTrue, type User, accountingContract } from '@mms/shared';
import { initServer } from '@ts-rest/fastify';
import type { ContractRouteArgs } from '../../../lib/contractRouterTypes.js';
import { canReadCollection, canDeleteCollection } from '../../../services/rbacService.js';
import { handleContractError } from '../../../lib/contractError.js';
import { withTenant } from '../../../db/tenant-context.js';
import { accountingUseCases } from '../../../accounting/use-cases/accountingUseCases.js';

const s = initServer();

export const accountingContractRouter: FastifyPluginAsync = async (fastify) => {
  const router = s.router(accountingContract, {
    listAccounts: async ({ query, request }: ContractRouteArgs<typeof accountingContract['listAccounts']>): Promise<unknown> => {
      const user = request.user as User;
      if (!canReadCollection(user, 'accounts')) {
        return { status: 403 as const, body: { type: 'forbidden', message: 'Insufficient permissions' } };
      }
      const includeDeleted = isQueryFlagTrue(query?.includeDeleted);
      if (includeDeleted && !canDeleteCollection(user, 'accounts')) {
        return { status: 403 as const, body: { type: 'forbidden', message: 'Insufficient permissions' } };
      }
      try {
        if (query?.page !== undefined) {
          const result = await withTenant(
            String(request.tenant?.id),
            () =>
              accountingUseCases.loadAccountsPage({
                ...(query as Record<string, unknown>),
                includeDeleted,
              } as Parameters<typeof accountingUseCases.loadAccountsPage>[0]),
            { readOnly: true },
          );
          return { status: 200 as const, body: result };
        }
        const accounts = await withTenant(
          String(request.tenant?.id),
          () => accountingUseCases.loadAccounts({ ...(query as Record<string, unknown>), includeDeleted }),
          { readOnly: true },
        );
        return { status: 200 as const, body: { accounts } };
      } catch (error: unknown) {
        return handleContractError(request, error, { status: 500, body: { type: 'database_error', message: 'Failed to list accounts' } });
      }
    },
    listEntries: async ({ query, request }: ContractRouteArgs<typeof accountingContract['listEntries']>): Promise<unknown> => {
      const user = request.user as User;
      if (!canReadCollection(user, 'accounting_entries')) {
        return { status: 403 as const, body: { type: 'forbidden', message: 'Insufficient permissions' } };
      }
      const includeDeleted = isQueryFlagTrue(query?.includeDeleted);
      if (includeDeleted && !canDeleteCollection(user, 'accounting_entries')) {
        return { status: 403 as const, body: { type: 'forbidden', message: 'Insufficient permissions' } };
      }
      try {
        if (query?.page !== undefined) {
          const result = await withTenant(
            String(request.tenant?.id),
            () =>
              accountingUseCases.loadEntriesPage({
                ...(query as Record<string, unknown>),
                includeDeleted,
              } as Parameters<typeof accountingUseCases.loadEntriesPage>[0]),
            { readOnly: true },
          );
          return { status: 200 as const, body: result };
        }
        const entries = await withTenant(
          String(request.tenant?.id),
          () => accountingUseCases.loadEntries({ ...(query as Record<string, unknown>), includeDeleted }),
          { readOnly: true },
        );
        return { status: 200 as const, body: { entries } };
      } catch (error: unknown) {
        return handleContractError(request, error, { status: 500, body: { type: 'database_error', message: 'Failed to list journal entries' } });
      }
    },
    listFiscalYears: async ({ query, request }: ContractRouteArgs<typeof accountingContract['listFiscalYears']>): Promise<unknown> => {
      const user = request.user as User;
      if (!canReadCollection(user, 'fiscal_years')) {
        return { status: 403 as const, body: { type: 'forbidden', message: 'Insufficient permissions' } };
      }
      const includeDeleted = isQueryFlagTrue(query?.includeDeleted);
      if (includeDeleted && !canDeleteCollection(user, 'fiscal_years')) {
        return { status: 403 as const, body: { type: 'forbidden', message: 'Insufficient permissions' } };
      }
      try {
        if (query?.page !== undefined) {
          const result = await withTenant(
            String(request.tenant?.id),
            () =>
              accountingUseCases.loadFiscalYearsPage({
                ...(query as Record<string, unknown>),
                includeDeleted,
              } as Parameters<typeof accountingUseCases.loadFiscalYearsPage>[0]),
            { readOnly: true },
          );
          return { status: 200 as const, body: result };
        }
        const fiscalYears = await withTenant(
          String(request.tenant?.id),
          () => accountingUseCases.loadFiscalYears({ includeDeleted }),
          { readOnly: true },
        );
        return { status: 200 as const, body: { fiscalYears } };
      } catch (error: unknown) {
        return handleContractError(request, error, { status: 500, body: { type: 'database_error', message: 'Failed to list fiscal years' } });
      }
    },
  } as unknown as Parameters<typeof s.router>[1]);

  await fastify.register(s.plugin(router));
};
