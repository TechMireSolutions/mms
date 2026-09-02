import type { QuestionBankRepository } from '../repository/questionBankRepository.js';
import { questionBankRepository } from '../repository/questionBankRepositoryAdapter.js';
import { getRequestTenant } from '../../lib/tenantContext.js';
import { createGenericRelationalService } from '../../services/genericRelationalService.js';
import {
  defineTenantBulkCollectionService,
  scopeDeleted,
  upsertWithBroadcast,
} from '../../services/tenantBulkService.js';
import { getQuestionBankModulePreferencesForWorkspace } from '../../db/repositories/questionBankModulePreferencesRepository.js';
import {
  type QuestionBankQuestion,
  type QuestionBankTest,
  type QuestionBankResult,
  type QuestionBankListQuery,
  type QuestionBankReportAggregates,
  type QuestionBankReportQuery,
  type QuestionBankCommandMetricsSnapshot,
  EMPTY_QB_REPORT_AGGREGATES,
  questionBankQuestionListSchema,
  questionBankTestListSchema,
  questionBankResultListSchema,
  questionBankQuestionRecordSchema,
  normalizeQuestionBankQuestion,
  normalizeQuestionBankModulePreferences,
} from '@mms/shared';

const EMPTY_METRICS: QuestionBankCommandMetricsSnapshot = {
  total: 0,
  easy: 0,
  medium: 0,
  hard: 0,
  totalTests: 0,
  totalResults: 0,
  categories: 0,
};

/**
 * Question bank use-cases — composition root binding a
 * {@link QuestionBankRepository} to every operation. Production uses the default
 * Drizzle-backed `questionBankUseCases`; tests can pass a fake repository to
 * exercise orchestration in isolation.
 */
export function createQuestionBankUseCases(repo: QuestionBankRepository = questionBankRepository) {
  const questionBulkService = defineTenantBulkCollectionService<QuestionBankQuestion>(
    { listByWorkspace: repo.listQuestionsByWorkspace, replaceForWorkspace: repo.replaceQuestionsForWorkspace },
    questionBankQuestionListSchema,
    'questions',
  );

  const testBulkService = defineTenantBulkCollectionService<QuestionBankTest>(
    { listByWorkspace: repo.listTestsByWorkspace, replaceForWorkspace: repo.replaceTestsForWorkspace },
    questionBankTestListSchema,
    'tests',
  );

  const resultBulkService = defineTenantBulkCollectionService<QuestionBankResult>(
    { listByWorkspace: repo.listResultsByWorkspace, replaceForWorkspace: repo.replaceResultsForWorkspace },
    questionBankResultListSchema,
    'assessment_results',
  );

  const questionCrud = createGenericRelationalService<QuestionBankQuestion>({
    repo: {
      listByWorkspace: repo.listQuestionsByWorkspace,
      findById: repo.findQuestionById,
      save: repo.saveQuestion,
    },
    schema: questionBankQuestionRecordSchema,
    websocketCollection: 'questions',
    idPrefix: 'q',
    normalizeFn: normalizeQuestionBankQuestion,
  });

  return {
    /** Migration / teardown only — API bulk writes must use upsertQuestions. */
    replaceQuestions: questionBulkService.replace,
    replaceTests: testBulkService.replace,
    replaceResults: resultBulkService.replace,

    loadQuestions: async (options?: { includeDeleted?: boolean }): Promise<QuestionBankQuestion[]> => {
      const rows = await questionCrud.loadAll({ includeDeleted: true });
      return scopeDeleted(rows, options?.includeDeleted);
    },

    loadQuestionsPage: async (query: QuestionBankListQuery & { includeDeleted?: boolean }) => {
      const tenant = getRequestTenant();
      if (!tenant) {
        return {
          questions: [],
          total: 0,
          page: query.page ?? 1,
          limit: query.limit ?? 15,
          hasMore: false,
        };
      }
      return repo.listQuestionsPage(tenant, query);
    },

    loadTests: async (): Promise<QuestionBankTest[]> => testBulkService.load(),
    loadResults: async (): Promise<QuestionBankResult[]> => resultBulkService.load(),

    upsertQuestions: (records: QuestionBankQuestion[]) =>
      upsertWithBroadcast(questionBankQuestionListSchema, records, repo.bulkSaveQuestions, 'questions'),
    upsertTests: (records: QuestionBankTest[]) =>
      upsertWithBroadcast(questionBankTestListSchema, records, repo.bulkSaveTests, 'tests'),
    upsertResults: (records: QuestionBankResult[]) =>
      upsertWithBroadcast(questionBankResultListSchema, records, repo.bulkSaveResults, 'assessment_results'),

    deleteQuestionById: questionCrud.deleteById,
    restoreQuestionById: questionCrud.restoreById,
    bulkSoftDeleteQuestions: questionCrud.bulkDeleteByIds,
    bulkRestoreQuestions: questionCrud.bulkRestoreByIds,

    loadQuestionBankWidgetAggregates: async (
      queries: import('@mms/shared').WidgetQuery[],
    ): Promise<Record<string, import('@mms/shared').WidgetAggregateResult>> => {
      const tenant = getRequestTenant();
      if (!tenant) return {};
      return repo.aggregateQuestionBankWidgetQueries(tenant, queries);
    },

    loadQuestionBankReportAggregates: async (
      query: QuestionBankReportQuery = {},
    ): Promise<QuestionBankReportAggregates> => {
      const tenant = getRequestTenant();
      if (!tenant) return EMPTY_QB_REPORT_AGGREGATES;
      return repo.aggregateQuestionBankReport(tenant, query);
    },

    loadQuestionBankCommandMetrics: async (): Promise<QuestionBankCommandMetricsSnapshot> => {
      const tenant = getRequestTenant();
      if (!tenant) return EMPTY_METRICS;
      const [metrics, prefsRaw] = await Promise.all([
        repo.aggregateQuestionBankCommandMetrics(tenant),
        getQuestionBankModulePreferencesForWorkspace(tenant),
      ]);
      const prefs = normalizeQuestionBankModulePreferences(prefsRaw);
      return { ...metrics, categories: prefs.categories?.length ?? 0 };
    },
  };
}

export const questionBankUseCases = createQuestionBankUseCases();
