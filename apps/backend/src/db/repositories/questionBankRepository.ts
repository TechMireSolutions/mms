import {
  type QuestionBankQuestion,
  type QuestionBankTest,
  type QuestionBankResult,
} from '@mms/shared';
import { questions, tests, assessmentResults } from '../schema.js';
import { createGenericRepository } from './genericRepository.js';

const questionsRepo = createGenericRepository<QuestionBankQuestion, typeof questions>(questions, {
  updateStrategy: 'overwrite',
  conflictTarget: [questions.workspaceSubdomain, questions.id],
});
const testsRepo = createGenericRepository<QuestionBankTest, typeof tests>(tests, {
  updateStrategy: 'overwrite',
  conflictTarget: [tests.workspaceSubdomain, tests.id],
});
const resultsRepo = createGenericRepository<QuestionBankResult, typeof assessmentResults>(assessmentResults, {
  updateStrategy: 'overwrite',
  conflictTarget: [assessmentResults.workspaceSubdomain, assessmentResults.id],
});

export const listQuestionsByWorkspace = questionsRepo.listByWorkspace;
export const findQuestionById = questionsRepo.findById;
export const saveQuestion = questionsRepo.save;
export const bulkSaveQuestions = questionsRepo.bulkSave;
export const replaceQuestionsForWorkspace = questionsRepo.replaceForWorkspace;

export const listTestsByWorkspace = testsRepo.listByWorkspace;
export const findTestById = testsRepo.findById;
export const saveTest = testsRepo.save;
export const bulkSaveTests = testsRepo.bulkSave;
export const replaceTestsForWorkspace = testsRepo.replaceForWorkspace;

export const listResultsByWorkspace = resultsRepo.listByWorkspace;
export const findResultById = resultsRepo.findById;
export const saveResult = resultsRepo.save;
export const bulkSaveResults = resultsRepo.bulkSave;
export const replaceResultsForWorkspace = resultsRepo.replaceForWorkspace;

export async function deleteQuestionBankByWorkspace(workspaceSubdomain: string): Promise<void> {
  await questionsRepo.deleteByWorkspace(workspaceSubdomain);
  await testsRepo.deleteByWorkspace(workspaceSubdomain);
  await resultsRepo.deleteByWorkspace(workspaceSubdomain);
}
