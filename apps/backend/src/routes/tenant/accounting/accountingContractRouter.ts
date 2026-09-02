import type { FastifyPluginAsync } from 'fastify';
import type { User } from '@mms/shared';
import { rootContract } from '@mms/shared';
import { initServer } from '@ts-rest/fastify';
import { canReadCollection } from '../../../services/rbacService.js';
import { handleContractError } from '../../../lib/contractError.js';
import { withTenant } from '../../../db/tenant-context.js';
import { accountingUseCases } from '../../../accounting/use-cases/accountingUseCases.js';

const s = initServer();

export const accountingContractRouter: FastifyPluginAsync = async (fastify) => {
  const router = s.router(rootContract.accounting, {
    listAccounts: async ({ query, request }: any) => {
      const user = request.user as User;
      if (!canReadCollection(user, 'accounts')) {
        return { status: 403 as const, body: { type: 'forbidden', message: 'Insufficient permissions' } };
      }
      try {
        if (query?.page !== undefined) {
          const result = await withTenant(String(request.tenant?.id), () => accountingUseCases.loadAccountsPage(query), { readOnly: true });
          return { status: 200 as const, body: result };
        }
        const accounts = await withTenant(String(request.tenant?.id), () => accountingUseCases.loadAccounts(query), { readOnly: true });
        return { status: 200 as const, body: { accounts } };
      } catch (error: unknown) {
        return handleContractError(request, error, { status: 500, body: { type: 'database_error', message: 'Failed to list accounts' } });
      }
    },
    listEntries: async ({ query, request }: any) => {
      const user = request.user as User;
      if (!canReadCollection(user, 'accounting_entries')) {
        return { status: 403 as const, body: { type: 'forbidden', message: 'Insufficient permissions' } };
      }
      try {
        if (query?.page !== undefined) {
          const result = await withTenant(String(request.tenant?.id), () => accountingUseCases.loadEntriesPage(query), { readOnly: true });
          return { status: 200 as const, body: result };
        }
        const entries = await withTenant(String(request.tenant?.id), () => accountingUseCases.loadEntries(query), { readOnly: true });
        return { status: 200 as const, body: { entries } };
      } catch (error: unknown) {
        return handleContractError(request, error, { status: 500, body: { type: 'database_error', message: 'Failed to list journal entries' } });
      }
    },
    listFiscalYears: async ({ query, request }: any) => {
      const user = request.user as User;
      if (!canReadCollection(user, 'fiscal_years')) {
        return { status: 403 as const, body: { type: 'forbidden', message: 'Insufficient permissions' } };
      }
      try {
        if (query?.page !== undefined) {
          const result = await withTenant(String(request.tenant?.id), () => accountingUseCases.loadFiscalYearsPage(query), { readOnly: true });
          return { status: 200 as const, body: result };
        }
        const fiscalYears = await withTenant(String(request.tenant?.id), () => accountingUseCases.loadFiscalYears(), { readOnly: true });
        return { status: 200 as const, body: { fiscalYears } };
      } catch (error: unknown) {
        return handleContractError(request, error, { status: 500, body: { type: 'database_error', message: 'Failed to list fiscal years' } });
      }
    },
  } as any);

  await fastify.register(s.plugin(router));
};
