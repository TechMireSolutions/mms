import {
  type QuestionBankQuestion,
  type QuestionBankTest,
  type QuestionBankResult,
  getQuestionCategoryIds,
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
import { generateCompletion } from './llmService.js';

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

export interface GenerateQuestionBankTestInput {
  categoryIds: string[];
  difficulty: 'easy' | 'medium' | 'hard' | 'any';
  numQuestions: number;
  shuffle: boolean;
}

export interface GenerateQuestionBankTestResult {
  questionIds: string[];
  mode: 'ai' | 'fallback';
  message?: string;
}

function filterQuestionPool(
  questions: readonly QuestionBankQuestion[],
  input: GenerateQuestionBankTestInput,
): QuestionBankQuestion[] {
  return questions.filter((question) => {
    const matchesCategory =
      input.categoryIds.length === 0 ||
      getQuestionCategoryIds(question).some((categoryId) => input.categoryIds.includes(categoryId));
    const matchesDifficulty = input.difficulty === 'any' || question.difficulty === input.difficulty;
    return matchesCategory && matchesDifficulty;
  });
}

function fallbackSelectQuestionIds(
  pool: readonly QuestionBankQuestion[],
  input: GenerateQuestionBankTestInput,
): string[] {
  const sortedPool = input.shuffle ? [...pool].sort(() => Math.random() - 0.5) : [...pool];
  return sortedPool.slice(0, input.numQuestions).map((question) => question.id);
}

function extractJsonObject(rawResponse: string): unknown {
  const withoutFence = rawResponse
    .replace(/^```(?:json)?/i, '')
    .replace(/```$/i, '')
    .trim();
  const jsonMatch = withoutFence.match(/\{[\s\S]*\}/);
  return JSON.parse(jsonMatch?.[0] ?? withoutFence);
}

function parseAiQuestionIds(rawResponse: string, eligibleIds: Set<string>, count: number): string[] {
  const parsed = extractJsonObject(rawResponse) as { questionIds?: unknown };
  if (!Array.isArray(parsed.questionIds)) return [];

  const selected: string[] = [];
  for (const rawId of parsed.questionIds) {
    const questionId = String(rawId);
    if (!eligibleIds.has(questionId) || selected.includes(questionId)) continue;
    selected.push(questionId);
    if (selected.length === count) break;
  }
  return selected;
}

function buildQuestionPaperPrompt(pool: readonly QuestionBankQuestion[], input: GenerateQuestionBankTestInput): string {
  const candidateQuestions = pool.map((question) => ({
    id: question.id,
    text: question.text,
    type: question.type,
    difficulty: question.difficulty,
    language: question.questionLanguage,
    categoryIds: getQuestionCategoryIds(question),
  }));

  return JSON.stringify({
    task: 'Select questions for a balanced madrasa test paper from the provided question bank.',
    constraints: {
      numberOfQuestions: input.numQuestions,
      difficulty: input.difficulty,
      categoryIds: input.categoryIds,
      shuffleRequested: input.shuffle,
      onlyUseCandidateIds: true,
      responseShape: { questionIds: ['question-id'] },
    },
    guidance: [
      'Prefer coverage across categories when multiple categories are available.',
      'Avoid near-duplicate question wording.',
      'Prefer a fair mix of question types when possible.',
      'Return only JSON with a questionIds array. Do not include explanations.',
    ],
    candidateQuestions,
  });
}

export async function generateQuestionBankTestSelection(
  input: GenerateQuestionBankTestInput,
): Promise<GenerateQuestionBankTestResult> {
  const questions = await loadQuestions();
  const pool = filterQuestionPool(questions, input);
  const fallbackIds = fallbackSelectQuestionIds(pool, input);

  if (fallbackIds.length < input.numQuestions) {
    return {
      questionIds: fallbackIds,
      mode: 'fallback',
      message: 'Not enough eligible questions were available for AI selection.',
    };
  }

  try {
    const response = await generateCompletion(buildQuestionPaperPrompt(pool, input), {
      systemInstruction:
        'You are an exam paper assembly assistant for a madrasa management system. Select only question IDs from the provided candidate list. Never invent IDs. Return strict JSON only.',
    });
    const aiIds = parseAiQuestionIds(response, new Set(pool.map((question) => question.id)), input.numQuestions);

    if (aiIds.length === input.numQuestions) {
      return { questionIds: aiIds, mode: 'ai' };
    }

    return {
      questionIds: fallbackIds,
      mode: 'fallback',
      message: 'AI returned an incomplete or invalid selection, so MMS used the eligible question pool instead.',
    };
  } catch (caughtError: unknown) {
    return {
      questionIds: fallbackIds,
      mode: 'fallback',
      message: caughtError instanceof Error ? caughtError.message : 'AI generation failed.',
    };
  }
}
