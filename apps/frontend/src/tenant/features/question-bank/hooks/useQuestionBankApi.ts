import { useMutation, useQueryClient } from '@tanstack/react-query';
import type {
  QuestionBankCommandMetricsSnapshot,
  QuestionBankQuestion,
  QuestionBankTest,
  QuestionBankResult,
} from '@mms/shared';
import { QUESTION_BANK_MODULE_CONTRACT } from '@mms/shared';
import { useServerMetrics } from '@/hooks/useServerMetrics';
import { apiJson } from '@/lib/apiClient';
import { saveCollection } from '@/lib/db';
import { useCollectionSync } from '@/hooks/useCollectionSync';

const QUESTION_BANK_API = QUESTION_BANK_MODULE_CONTRACT.restBasePath;

export const QUESTION_BANK_METRICS_QUERY_KEY = [QUESTION_BANK_MODULE_CONTRACT.moduleId, 'metrics'] as const;

export const QUESTION_BANK_QUESTIONS_QUERY_KEY = [QUESTION_BANK_MODULE_CONTRACT.moduleId, 'questions', 'list'] as const;
export const QUESTION_BANK_TESTS_QUERY_KEY = [QUESTION_BANK_MODULE_CONTRACT.moduleId, 'tests', 'list'] as const;
export const QUESTION_BANK_RESULTS_QUERY_KEY = [QUESTION_BANK_MODULE_CONTRACT.moduleId, 'results', 'list'] as const;

export function useQuestionBankQuestions(options?: { enabled?: boolean }) {
  return useCollectionSync<QuestionBankQuestion>({
    queryKey: QUESTION_BANK_QUESTIONS_QUERY_KEY,
    apiPath: `${QUESTION_BANK_API}/questions`,
    responseKey: 'questions',
    collectionName: 'questions',
    enabled: options?.enabled,
  });
}

export function useQuestionBankQuestionsCollection(options?: { enabled?: boolean }): QuestionBankQuestion[] {
  return useQuestionBankQuestions(options).syncedData;
}

export function useQuestionBankTests(options?: { enabled?: boolean }) {
  return useCollectionSync<QuestionBankTest>({
    queryKey: QUESTION_BANK_TESTS_QUERY_KEY,
    apiPath: `${QUESTION_BANK_API}/tests`,
    responseKey: 'tests',
    collectionName: 'tests',
    enabled: options?.enabled,
  });
}

export function useQuestionBankTestsCollection(options?: { enabled?: boolean }): QuestionBankTest[] {
  return useQuestionBankTests(options).syncedData;
}

export function useQuestionBankResults(options?: { enabled?: boolean }) {
  return useCollectionSync<QuestionBankResult>({
    queryKey: QUESTION_BANK_RESULTS_QUERY_KEY,
    apiPath: `${QUESTION_BANK_API}/assessment-results`,
    responseKey: 'results',
    collectionName: 'assessment_results',
    enabled: options?.enabled,
  });
}

export function useQuestionBankResultsCollection(options?: { enabled?: boolean }): QuestionBankResult[] {
  return useQuestionBankResults(options).syncedData;
}

export function useQuestionBankMutations() {
  const queryClient = useQueryClient();

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: QUESTION_BANK_QUESTIONS_QUERY_KEY });
    void queryClient.invalidateQueries({ queryKey: QUESTION_BANK_TESTS_QUERY_KEY });
    void queryClient.invalidateQueries({ queryKey: QUESTION_BANK_RESULTS_QUERY_KEY });
    void queryClient.invalidateQueries({ queryKey: QUESTION_BANK_METRICS_QUERY_KEY });
  };

  const replaceQuestions = useMutation({
    mutationFn: async (questions: QuestionBankQuestion[]) =>
      apiJson<{ questions: QuestionBankQuestion[] }>(`${QUESTION_BANK_API}/questions/bulk`, {
        method: 'PUT',
        body: JSON.stringify(questions),
      }),
    onSuccess: (questionsResponse) => {
      saveCollection('questions', questionsResponse.questions);
      invalidate();
    },
  });

  const replaceTests = useMutation({
    mutationFn: async (tests: QuestionBankTest[]) =>
      apiJson<{ tests: QuestionBankTest[] }>(`${QUESTION_BANK_API}/tests/bulk`, {
        method: 'PUT',
        body: JSON.stringify(tests),
      }),
    onSuccess: (testsResponse) => {
      saveCollection('tests', testsResponse.tests);
      invalidate();
    },
  });

  const replaceResults = useMutation({
    mutationFn: async (results: QuestionBankResult[]) =>
      apiJson<{ results: QuestionBankResult[] }>(`${QUESTION_BANK_API}/assessment-results/bulk`, {
        method: 'PUT',
        body: JSON.stringify(results),
      }),
    onSuccess: (resultsResponse) => {
      saveCollection('assessment_results', resultsResponse.results);
      invalidate();
    },
  });

  return { replaceQuestions, replaceTests, replaceResults };
}

export function useQuestionBankMetrics(options?: { enabled?: boolean }) {
  return useServerMetrics<QuestionBankCommandMetricsSnapshot>({
    moduleId: QUESTION_BANK_MODULE_CONTRACT.moduleId,
    apiPath: QUESTION_BANK_MODULE_CONTRACT.restBasePath,
    enabled: options?.enabled,
  });
}
