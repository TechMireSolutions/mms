import type { FastifyPluginAsync } from 'fastify';
import type { User, WidgetQuery } from '@mms/shared';
import { questionBankContract } from '@mms/shared';
import { initServer } from '@ts-rest/fastify';
import type { ContractRouteArgs } from '../../../lib/contractRouterTypes.js';
import { canReadCollection, canDeleteCollection } from '../../../services/rbacService.js';
import { withTenant } from '../../../db/tenant-context.js';
import { questionBankUseCases } from '../../../questionBank/use-cases/questionBankUseCases.js';

const s = initServer();

export const questionBankContractRouter: FastifyPluginAsync = async (fastify) => {
  const router = s.router(questionBankContract, {
    reportAggregates: async ({ query, request }: ContractRouteArgs<typeof questionBankContract['reportAggregates']>): Promise<unknown> => {
      const user = request.user as User;
      if (!canReadCollection(user, 'questions')) {
        return { status: 403 as const, body: { type: 'forbidden', message: 'Insufficient permissions' } };
      }
      try {
        const aggregates = await withTenant(
          String(request.tenant?.id),
          () => questionBankUseCases.loadQuestionBankReportAggregates(query || {}),
          { readOnly: true },
        );
        return { status: 200 as const, body: aggregates };
      } catch {
        return { status: 500 as const, body: { type: 'database_error', message: 'Failed to load report aggregates' } };
      }
    },
    listQuestions: async ({ query, request }: ContractRouteArgs<typeof questionBankContract['listQuestions']>): Promise<unknown> => {
      const user = request.user as User;
      if (!canReadCollection(user, 'questions')) {
        return { status: 403 as const, body: { type: 'forbidden', message: 'Insufficient permissions' } };
      }
      const includeDeleted = query?.includeDeleted === 'true' || query?.includeDeleted === true;
      if (includeDeleted && !canDeleteCollection(user, 'questions')) {
        return { status: 403 as const, body: { type: 'forbidden', message: 'Insufficient permissions' } };
      }
      try {
        if (query?.page !== undefined || query?.limit !== undefined || query?.search !== undefined || query?.categoryId !== undefined || query?.difficulty !== undefined) {
          const result = await withTenant(String(request.tenant?.id), () => questionBankUseCases.loadQuestionsPage({ ...query, includeDeleted } as Parameters<typeof questionBankUseCases.loadQuestionsPage>[0]), { readOnly: true });
          return { status: 200 as const, body: result };
        }
        const questions = await withTenant(String(request.tenant?.id), () => questionBankUseCases.loadQuestions({ includeDeleted }), { readOnly: true });
        return { status: 200 as const, body: { questions } };
      } catch {
        return { status: 500 as const, body: { type: 'database_error', message: 'Failed to list questions' } };
      }
    },
    bulkDeleteQuestions: async ({ body, request }: ContractRouteArgs<typeof questionBankContract['bulkDeleteQuestions']>): Promise<unknown> => {
      const user = request.user as User;
      if (!canDeleteCollection(user, 'questions')) {
        return { status: 403 as const, body: { type: 'forbidden', message: 'Insufficient permissions' } };
      }
      try {
        const result = await withTenant(String(request.tenant?.id), () =>
          questionBankUseCases.bulkSoftDeleteQuestions(body.ids.map(String), String(user.id), body.deletionReason),
          { readOnly: false },
        );
        return { status: 200 as const, body: { success: true, ...result } };
      } catch {
        return { status: 500 as const, body: { type: 'database_error', message: 'Failed to bulk delete questions' } };
      }
    },
    bulkRestoreQuestions: async ({ body, request }: ContractRouteArgs<typeof questionBankContract['bulkRestoreQuestions']>): Promise<unknown> => {
      const user = request.user as User;
      if (!canDeleteCollection(user, 'questions')) {
        return { status: 403 as const, body: { type: 'forbidden', message: 'Insufficient permissions' } };
      }
      try {
        const result = await withTenant(String(request.tenant?.id), () =>
          questionBankUseCases.bulkRestoreQuestions(body.ids.map(String)),
          { readOnly: false },
        );
        return { status: 200 as const, body: { success: true, ...result } };
      } catch {
        return { status: 500 as const, body: { type: 'database_error', message: 'Failed to bulk restore questions' } };
      }
    },
    listTests: async ({ request }: ContractRouteArgs<typeof questionBankContract['listTests']>): Promise<unknown> => {
      const user = request.user as User;
      if (!canReadCollection(user, 'tests')) {
        return { status: 403 as const, body: { type: 'forbidden', message: 'Insufficient permissions' } };
      }
      try {
        const tests = await withTenant(String(request.tenant?.id), () => questionBankUseCases.loadTests(), { readOnly: true });
        return { status: 200 as const, body: { tests } };
      } catch {
        return { status: 500 as const, body: { type: 'database_error', message: 'Failed to list tests' } };
      }
    },
    listResults: async ({ request }: ContractRouteArgs<typeof questionBankContract['listResults']>): Promise<unknown> => {
      const user = request.user as User;
      if (!canReadCollection(user, 'assessment_results')) {
        return { status: 403 as const, body: { type: 'forbidden', message: 'Insufficient permissions' } };
      }
      try {
        const results = await withTenant(String(request.tenant?.id), () => questionBankUseCases.loadResults(), { readOnly: true });
        return { status: 200 as const, body: { results } };
      } catch {
        return { status: 500 as const, body: { type: 'database_error', message: 'Failed to list assessment results' } };
      }
    },
    widgetAggregates: async ({ body, request }: ContractRouteArgs<typeof questionBankContract['widgetAggregates']>): Promise<unknown> => {
      const user = request.user as User;
      if (!canReadCollection(user, 'questions')) {
        return { status: 403 as const, body: { type: 'forbidden', message: 'Insufficient permissions' } };
      }
      try {
        const result = await withTenant(String(request.tenant?.id), () => questionBankUseCases.loadQuestionBankWidgetAggregates(body.widgets as WidgetQuery[]), { readOnly: true });
        return { status: 200 as const, body: result };
      } catch (error) {
        return { status: 500 as const, body: { type: 'database_error', message: 'Failed to load widget aggregates' } };
      }
    },
  } as unknown as Parameters<typeof s.router>[1]);

  await fastify.register(s.plugin(router));
};
