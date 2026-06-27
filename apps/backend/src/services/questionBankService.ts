import {
  type QuestionBankQuestion,
  type QuestionBankTest,
  type QuestionBankResult,
  questionBankQuestionListSchema,
  questionBankQuestionRecordSchema,
  questionBankTestListSchema,
  questionBankTestRecordSchema,
  questionBankResultListSchema,
  questionBankResultRecordSchema,
} from '@mms/shared';
import { defineCollectionCrudService } from './collectionCrudService.js';
import { persistCollection } from './dbSyncService.js';

const QUESTIONS_COLLECTION = 'questions';
const TESTS_COLLECTION = 'tests';
const RESULTS_COLLECTION = 'assessment_results';

// --- Questions ---
const normalizeQuestion = (record: QuestionBankQuestion) => questionBankQuestionRecordSchema.parse(record);
const questionCrud = defineCollectionCrudService(QUESTIONS_COLLECTION, questionBankQuestionListSchema, normalizeQuestion);
export const loadQuestions = questionCrud.load;
export async function replaceQuestions(records: QuestionBankQuestion[]): Promise<QuestionBankQuestion[]> {
  const parsed = questionBankQuestionListSchema.parse(records);
  await persistCollection(QUESTIONS_COLLECTION, parsed);
  return parsed;
}

// --- Tests ---
const normalizeTest = (record: QuestionBankTest) => questionBankTestRecordSchema.parse(record);
const testCrud = defineCollectionCrudService(TESTS_COLLECTION, questionBankTestListSchema, normalizeTest);
export const loadTests = testCrud.load;
export async function replaceTests(records: QuestionBankTest[]): Promise<QuestionBankTest[]> {
  const parsed = questionBankTestListSchema.parse(records);
  await persistCollection(TESTS_COLLECTION, parsed);
  return parsed;
}

// --- Assessment Results ---
const normalizeResult = (record: QuestionBankResult) => questionBankResultRecordSchema.parse(record);
const resultCrud = defineCollectionCrudService(RESULTS_COLLECTION, questionBankResultListSchema, normalizeResult);
export const loadResults = resultCrud.load;
export async function replaceResults(records: QuestionBankResult[]): Promise<QuestionBankResult[]> {
  const parsed = questionBankResultListSchema.parse(records);
  await persistCollection(RESULTS_COLLECTION, parsed);
  return parsed;
}
