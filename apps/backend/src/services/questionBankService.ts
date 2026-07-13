import {
  type QuestionBankQuestion,
  type QuestionBankTest,
  type QuestionBankResult,
  questionBankQuestionListSchema,
  questionBankTestListSchema,
  questionBankResultListSchema,
} from '@mms/shared';
import {
  listQuestionsByWorkspace,
  replaceQuestionsForWorkspace,
  listTestsByWorkspace,
  replaceTestsForWorkspace,
  listResultsByWorkspace,
  replaceResultsForWorkspace,
} from '../db/repositories/questionBankRepository.js';
import { defineTenantBulkCollectionService } from './tenantBulkService.js';

const questionService = defineTenantBulkCollectionService<QuestionBankQuestion>(
  { listByWorkspace: listQuestionsByWorkspace, replaceForWorkspace: replaceQuestionsForWorkspace },
  questionBankQuestionListSchema,
  'questions',
);
export const loadQuestions = questionService.load;
export const replaceQuestions = questionService.replace;

const testService = defineTenantBulkCollectionService<QuestionBankTest>(
  { listByWorkspace: listTestsByWorkspace, replaceForWorkspace: replaceTestsForWorkspace },
  questionBankTestListSchema,
  'tests',
);
export const loadTests = testService.load;
export const replaceTests = testService.replace;

const resultService = defineTenantBulkCollectionService<QuestionBankResult>(
  { listByWorkspace: listResultsByWorkspace, replaceForWorkspace: replaceResultsForWorkspace },
  questionBankResultListSchema,
  'assessment_results',
);
export const loadResults = resultService.load;
export const replaceResults = resultService.replace;
