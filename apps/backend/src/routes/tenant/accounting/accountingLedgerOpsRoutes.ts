import type { FastifyPluginAsync } from 'fastify';
import { ACCOUNTING_MODULE_MANIFEST, type User } from '@mms/shared';
import { canReadCollection, canWriteCollection } from '../../../services/rbacService.js';
import { sendForbidden, sendIfHttpDomainError, sendDatabaseError } from '../../../lib/httpErrors.js';
import { withTenant } from '../../../db/tenant-context.js';
import {
  closeFiscalYear,
  loadBankStatements,
  loadOpeningBalances,
  loadPostingRules,
  matchBankStatementLine,
  postOpeningBalances,
  upsertBankStatement,
  upsertOpeningBalances,
  upsertPostingRules,
} from '../../../accounting/use-cases/accountingLedgerOpsUseCases.js';

const COLLECTION = ACCOUNTING_MODULE_MANIFEST.collectionKey;

/** Posting rules, period close, opening balances, bank reconciliation. */
export const accountingLedgerOpsRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/posting-rules', async (request, reply) => {
    const user = request.user as User;
    if (!canReadCollection(user, COLLECTION)) return sendForbidden(reply);
    try {
      const rules = await withTenant(String(request.tenant?.id), () => loadPostingRules(), { readOnly: true });
      return reply.send({ rules });
    } catch (error) {
      return sendIfHttpDomainError(reply, error) ?? sendDatabaseError(reply, 'Failed to load posting rules', error);
    }
  });

  fastify.put('/posting-rules', async (request, reply) => {
    const user = request.user as User;
    if (!canWriteCollection(user, COLLECTION)) return sendForbidden(reply);
    try {
      const rules = await withTenant(
        String(request.tenant?.id),
        () => upsertPostingRules(request.body as Parameters<typeof upsertPostingRules>[0]),
        { readOnly: false },
      );
      return reply.send({ rules });
    } catch (error) {
      return sendIfHttpDomainError(reply, error) ?? sendDatabaseError(reply, 'Failed to save posting rules', error);
    }
  });

  fastify.post<{ Params: { id: string } }>('/fiscal-years/:id/close', async (request, reply) => {
    const user = request.user as User;
    if (!canWriteCollection(user, COLLECTION)) return sendForbidden(reply);
    const body = (request.body ?? {}) as { retainedEarningsAccountId?: string };
    try {
      const fiscalYear = await withTenant(
        String(request.tenant?.id),
        () => closeFiscalYear(request.params.id, String(user.id), body.retainedEarningsAccountId),
        { readOnly: false },
      );
      return reply.send({ fiscalYear });
    } catch (error) {
      return sendIfHttpDomainError(reply, error) ?? sendDatabaseError(reply, 'Failed to close fiscal year', error);
    }
  });

  fastify.get<{ Querystring: { fiscalYearId?: string } }>('/opening-balances', async (request, reply) => {
    const user = request.user as User;
    if (!canReadCollection(user, COLLECTION)) return sendForbidden(reply);
    const fiscalYearId = request.query.fiscalYearId?.trim();
    if (!fiscalYearId) return reply.status(400).send({ type: 'bad_request', message: 'fiscalYearId is required' });
    try {
      const balances = await withTenant(String(request.tenant?.id), () => loadOpeningBalances(fiscalYearId), {
        readOnly: true,
      });
      return reply.send({ balances });
    } catch (error) {
      return sendIfHttpDomainError(reply, error) ?? sendDatabaseError(reply, 'Failed to load opening balances', error);
    }
  });

  fastify.put('/opening-balances', async (request, reply) => {
    const user = request.user as User;
    if (!canWriteCollection(user, COLLECTION)) return sendForbidden(reply);
    const body = request.body as { fiscalYearId?: string; balances?: Parameters<typeof upsertOpeningBalances>[1] };
    if (!body.fiscalYearId) return reply.status(400).send({ type: 'bad_request', message: 'fiscalYearId is required' });
    try {
      const balances = await withTenant(
        String(request.tenant?.id),
        () => upsertOpeningBalances(body.fiscalYearId as string, body.balances ?? []),
        { readOnly: false },
      );
      return reply.send({ balances });
    } catch (error) {
      return sendIfHttpDomainError(reply, error) ?? sendDatabaseError(reply, 'Failed to save opening balances', error);
    }
  });

  fastify.post<{ Params: { fiscalYearId: string } }>(
    '/opening-balances/:fiscalYearId/post',
    async (request, reply) => {
      const user = request.user as User;
      if (!canWriteCollection(user, COLLECTION)) return sendForbidden(reply);
      try {
        await withTenant(String(request.tenant?.id), () => postOpeningBalances(request.params.fiscalYearId), {
          readOnly: false,
        });
        return reply.send({ success: true });
      } catch (error) {
        return sendIfHttpDomainError(reply, error) ?? sendDatabaseError(reply, 'Failed to post opening balances', error);
      }
    },
  );

  fastify.get('/bank-statements', async (request, reply) => {
    const user = request.user as User;
    if (!canReadCollection(user, COLLECTION)) return sendForbidden(reply);
    try {
      const statements = await withTenant(String(request.tenant?.id), () => loadBankStatements(), { readOnly: true });
      return reply.send({ statements });
    } catch (error) {
      return sendIfHttpDomainError(reply, error) ?? sendDatabaseError(reply, 'Failed to load bank statements', error);
    }
  });

  fastify.put('/bank-statements', async (request, reply) => {
    const user = request.user as User;
    if (!canWriteCollection(user, COLLECTION)) return sendForbidden(reply);
    try {
      const statement = await withTenant(String(request.tenant?.id), () => upsertBankStatement(request.body), {
        readOnly: false,
      });
      return reply.send({ statement });
    } catch (error) {
      return sendIfHttpDomainError(reply, error) ?? sendDatabaseError(reply, 'Failed to save bank statement', error);
    }
  });

  fastify.post('/bank-reconciliations', async (request, reply) => {
    const user = request.user as User;
    if (!canWriteCollection(user, COLLECTION)) return sendForbidden(reply);
    try {
      await withTenant(String(request.tenant?.id), () => matchBankStatementLine(request.body), { readOnly: false });
      return reply.send({ success: true });
    } catch (error) {
      return sendIfHttpDomainError(reply, error) ?? sendDatabaseError(reply, 'Failed to match bank line', error);
    }
  });
};
