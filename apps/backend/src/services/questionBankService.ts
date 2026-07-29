import {
  type QuestionBankQuestion,
  type QuestionBankTest,
  type QuestionBankResult,
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
import {
  defineTenantBulkCollectionService,
  scopeDeleted,
  upsertWithBroadcast,
} from './tenantBulkService.js';
import { createGenericRelationalService } from './genericRelationalService.js';

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
