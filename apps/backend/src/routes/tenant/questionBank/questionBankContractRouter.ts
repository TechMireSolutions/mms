import type { FastifyPluginAsync } from 'fastify';
import type { User } from '@mms/shared';
import { rootContract } from '@mms/shared';
import { initServer } from '@ts-rest/fastify';
import { canReadCollection, canDeleteCollection } from '../../../services/rbacService.js';
import { withTenant } from '../../../db/tenant-context.js';
import {
  loadQuestions,
  loadQuestionsPage,
  loadTests,
  loadResults,
  bulkSoftDeleteQuestions,
  bulkRestoreQuestions,
  loadQuestionBankWidgetAggregates,
} from '../../../services/questionBankService.js';

const s = initServer();

export const questionBankContractRouter: FastifyPluginAsync = async (fastify) => {
  const router = s.router(rootContract.questionBank, {
    listQuestions: async ({ query, request }: any) => {
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
          const result = await withTenant(String(request.tenant?.id), () => loadQuestionsPage({ ...query, includeDeleted }), { readOnly: true });
          return { status: 200 as const, body: result };
        }
        const questions = await withTenant(String(request.tenant?.id), () => loadQuestions({ includeDeleted }), { readOnly: true });
        return { status: 200 as const, body: { questions } };
      } catch {
        return { status: 500 as const, body: { type: 'database_error', message: 'Failed to list questions' } };
      }
    },
    bulkDeleteQuestions: async ({ body, request }: any) => {
      const user = request.user as User;
      if (!canDeleteCollection(user, 'questions')) {
        return { status: 403 as const, body: { type: 'forbidden', message: 'Insufficient permissions' } };
      }
      try {
        const result = await withTenant(String(request.tenant?.id), () =>
          bulkSoftDeleteQuestions(body.ids.map(String), String(user.id), body.deletionReason),
          { readOnly: false },
        );
        return { status: 200 as const, body: { success: true, ...result } };
      } catch {
        return { status: 500 as const, body: { type: 'database_error', message: 'Failed to bulk delete questions' } };
      }
    },
    bulkRestoreQuestions: async ({ body, request }: any) => {
      const user = request.user as User;
      if (!canDeleteCollection(user, 'questions')) {
        return { status: 403 as const, body: { type: 'forbidden', message: 'Insufficient permissions' } };
      }
      try {
        const result = await withTenant(String(request.tenant?.id), () =>
          bulkRestoreQuestions(body.ids.map(String)),
          { readOnly: false },
        );
        return { status: 200 as const, body: { success: true, ...result } };
      } catch {
        return { status: 500 as const, body: { type: 'database_error', message: 'Failed to bulk restore questions' } };
      }
    },
    listTests: async ({ request }: any) => {
      const user = request.user as User;
      if (!canReadCollection(user, 'tests')) {
        return { status: 403 as const, body: { type: 'forbidden', message: 'Insufficient permissions' } };
      }
      try {
        const tests = await withTenant(String(request.tenant?.id), () => loadTests(), { readOnly: true });
        return { status: 200 as const, body: { tests } };
      } catch {
        return { status: 500 as const, body: { type: 'database_error', message: 'Failed to list tests' } };
      }
    },
    listResults: async ({ request }: any) => {
      const user = request.user as User;
      if (!canReadCollection(user, 'assessment_results')) {
        return { status: 403 as const, body: { type: 'forbidden', message: 'Insufficient permissions' } };
      }
      try {
        const results = await withTenant(String(request.tenant?.id), () => loadResults(), { readOnly: true });
        return { status: 200 as const, body: { results } };
      } catch {
        return { status: 500 as const, body: { type: 'database_error', message: 'Failed to list assessment results' } };
      }
    },
    widgetAggregates: async ({ body, request }: any) => {
      const user = request.user as User;
      if (!canReadCollection(user, 'questions')) {
        return { status: 403 as const, body: { type: 'forbidden', message: 'Insufficient permissions' } };
      }
      try {
        const result = await withTenant(String(request.tenant?.id), () => loadQuestionBankWidgetAggregates(body.widgets as any), { readOnly: true });
        return { status: 200 as const, body: result };
      } catch (error) {
        return { status: 500 as const, body: { type: 'database_error', message: 'Failed to load widget aggregates' } };
      }
    },
  } as any);

  await fastify.register(s.plugin(router));
};
