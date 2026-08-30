import {
  type QuestionBankQuestion,
  type QuestionBankTest,
  type QuestionBankResult,
  type QuestionBankListQuery,
  type QuestionBankReportAggregates,
  type QuestionBankReportQuery,
  EMPTY_QB_REPORT_AGGREGATES,
  questionBankQuestionListSchema,
  questionBankTestListSchema,
  questionBankResultListSchema,
  questionBankQuestionRecordSchema,
  normalizeQuestionBankQuestion,
} from '@mms/shared';
import {
  listQuestionsByWorkspace,
  findQuestionById,
  saveQuestion,
  bulkSaveQuestions,
  replaceQuestionsForWorkspace,
  listTestsByWorkspace,
  bulkSaveTests,
  replaceTestsForWorkspace,
  listResultsByWorkspace,
  bulkSaveResults,
  replaceResultsForWorkspace,
} from '../db/repositories/questionBankRepository.js';
import { listQuestionsPage } from '../db/repositories/questionBankRepositoryList.js';
import { aggregateQuestionBankWidgetQueries } from '../db/repositories/questionBankRepositoryWidgets.js';
import { aggregateQuestionBankReport } from '../db/repositories/questionBankRepositoryReport.js';
import {
  defineTenantBulkCollectionService,
  scopeDeleted,
  upsertWithBroadcast,
} from './tenantBulkService.js';
import { createGenericRelationalService } from './genericRelationalService.js';
import { getRequestTenant } from '../lib/tenantContext.js';

const questionBulkService = defineTenantBulkCollectionService<QuestionBankQuestion>(
  { listByWorkspace: listQuestionsByWorkspace, replaceForWorkspace: replaceQuestionsForWorkspace },
  questionBankQuestionListSchema,
  'questions',
);
/** Migration / teardown only — API bulk writes must use upsertQuestions. */
export const replaceQuestions = questionBulkService.replace;

const testBulkService = defineTenantBulkCollectionService<QuestionBankTest>(
  { listByWorkspace: listTestsByWorkspace, replaceForWorkspace: replaceTestsForWorkspace },
  questionBankTestListSchema,
  'tests',
);
export const replaceTests = testBulkService.replace;

const resultBulkService = defineTenantBulkCollectionService<QuestionBankResult>(
  { listByWorkspace: listResultsByWorkspace, replaceForWorkspace: replaceResultsForWorkspace },
  questionBankResultListSchema,
  'assessment_results',
);
export const replaceResults = resultBulkService.replace;

const questionCrud = createGenericRelationalService<QuestionBankQuestion>({
  repo: {
    listByWorkspace: listQuestionsByWorkspace,
    findById: findQuestionById,
    save: saveQuestion,
  },
  schema: questionBankQuestionRecordSchema,
  websocketCollection: 'questions',
  idPrefix: 'q',
  normalizeFn: normalizeQuestionBankQuestion,
});

export async function loadQuestions(options?: { includeDeleted?: boolean }): Promise<QuestionBankQuestion[]> {
  const rows = await questionCrud.loadAll({ includeDeleted: true });
  return scopeDeleted(rows, options?.includeDeleted);
}

/** SQL-paged questions Work list (server-side search/category/difficulty/soft-delete). */
export async function loadQuestionsPage(
  query: QuestionBankListQuery & { includeDeleted?: boolean },
): Promise<{
  questions: QuestionBankQuestion[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}> {
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
  return listQuestionsPage(tenant, query);
}

export async function loadTests(): Promise<QuestionBankTest[]> {
  return testBulkService.load();
}

export async function loadResults(): Promise<QuestionBankResult[]> {
  return resultBulkService.load();
}

export const upsertQuestions = (records: QuestionBankQuestion[]) =>
  upsertWithBroadcast(questionBankQuestionListSchema, records, bulkSaveQuestions, 'questions');

export const upsertTests = (records: QuestionBankTest[]) =>
  upsertWithBroadcast(questionBankTestListSchema, records, bulkSaveTests, 'tests');

export const upsertResults = (records: QuestionBankResult[]) =>
  upsertWithBroadcast(questionBankResultListSchema, records, bulkSaveResults, 'assessment_results');

export const deleteQuestionById = questionCrud.deleteById;
export const restoreQuestionById = questionCrud.restoreById;
export const bulkSoftDeleteQuestions = questionCrud.bulkDeleteByIds;
export const bulkRestoreQuestions = questionCrud.bulkRestoreByIds;

export async function loadQuestionBankWidgetAggregates(
  queries: import('@mms/shared').WidgetQuery[],
): Promise<Record<string, import('@mms/shared').WidgetAggregateResult>> {
  const tenant = getRequestTenant();
  if (!tenant) return {};
  return aggregateQuestionBankWidgetQueries(tenant, queries);
}

export async function loadQuestionBankReportAggregates(
  query: QuestionBankReportQuery = {},
): Promise<QuestionBankReportAggregates> {
  const tenant = getRequestTenant();
  if (!tenant) return EMPTY_QB_REPORT_AGGREGATES;
  return aggregateQuestionBankReport(tenant, query);
}

