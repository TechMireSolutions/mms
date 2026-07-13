import {
  type QuestionBankQuestion,
  type QuestionBankTest,
  type QuestionBankResult,
} from '@mms/shared';
import { questions, tests, assessmentResults } from '../schema.js';
import { createGenericRepository } from './genericRepository.js';

const questionsRepo = createGenericRepository<QuestionBankQuestion, typeof questions>(questions);
const testsRepo = createGenericRepository<QuestionBankTest, typeof tests>(tests);
const resultsRepo = createGenericRepository<QuestionBankResult, typeof assessmentResults>(assessmentResults);

export const listQuestionsByWorkspace = questionsRepo.listByWorkspace;
export const replaceQuestionsForWorkspace = questionsRepo.replaceForWorkspace;

export const listTestsByWorkspace = testsRepo.listByWorkspace;
export const replaceTestsForWorkspace = testsRepo.replaceForWorkspace;

export const listResultsByWorkspace = resultsRepo.listByWorkspace;
export const replaceResultsForWorkspace = resultsRepo.replaceForWorkspace;

export async function deleteQuestionBankByWorkspace(workspaceSubdomain: string): Promise<void> {
  await questionsRepo.deleteByWorkspace(workspaceSubdomain);
  await testsRepo.deleteByWorkspace(workspaceSubdomain);
  await resultsRepo.deleteByWorkspace(workspaceSubdomain);
}
