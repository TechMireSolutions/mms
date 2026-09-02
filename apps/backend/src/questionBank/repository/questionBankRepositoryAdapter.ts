import type { QuestionBankRepository } from './questionBankRepository.js';
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
} from '../../db/repositories/questionBankRepository.js';
import {
  listQuestionsPage,
  aggregateQuestionBankCommandMetrics,
} from '../../db/repositories/questionBankRepositoryList.js';
import { aggregateQuestionBankWidgetQueries } from '../../db/repositories/questionBankRepositoryWidgets.js';
import { aggregateQuestionBankReport } from '../../db/repositories/questionBankRepositoryReport.js';

/**
 * Drizzle-backed adapter for {@link QuestionBankRepository}. Delegates to the
 * existing concrete repository functions (no SQL rewrite in this pass).
 */
export const questionBankRepository: QuestionBankRepository = {
  listQuestionsByWorkspace,
  findQuestionById,
  saveQuestion,
  bulkSaveQuestions,
  replaceQuestionsForWorkspace,
  listQuestionsPage,
  listTestsByWorkspace,
  bulkSaveTests,
  replaceTestsForWorkspace,
  listResultsByWorkspace,
  bulkSaveResults,
  replaceResultsForWorkspace,
  aggregateQuestionBankCommandMetrics,
  aggregateQuestionBankWidgetQueries,
  aggregateQuestionBankReport,
};
