import { useMutation, useQueryClient } from '@tanstack/react-query';
import type {
  QuestionBankCommandMetricsSnapshot,
  QuestionBankQuestion,
  QuestionBankTest,
  QuestionBankResult,
} from '@mms/shared';
import { QUESTION_BANK_MODULE_MANIFEST } from '@mms/shared';
import { useServerMetrics } from '@/hooks/useServerMetrics';
import { apiJson } from '@/lib/apiClient';
import { useCollectionSync } from '@/hooks/useCollectionSync';

const QUESTION_BANK_API = QUESTION_BANK_MODULE_MANIFEST.restBasePath;

export const QUESTION_BANK_METRICS_QUERY_KEY = [QUESTION_BANK_MODULE_MANIFEST.moduleId, 'metrics'] as const;

export const QUESTION_BANK_QUESTIONS_QUERY_KEY = [QUESTION_BANK_MODULE_MANIFEST.moduleId, 'questions', 'list'] as const;
export const QUESTION_BANK_TESTS_QUERY_KEY = [QUESTION_BANK_MODULE_MANIFEST.moduleId, 'tests', 'list'] as const;
export const QUESTION_BANK_RESULTS_QUERY_KEY = [QUESTION_BANK_MODULE_MANIFEST.moduleId, 'results', 'list'] as const;

export function useQuestionBankQuestions(options?: { enabled?: boolean; includeDeleted?: boolean }) {
  const includeDeleted = options?.includeDeleted ?? false;
  return useCollectionSync<QuestionBankQuestion>({
    queryKey: [...QUESTION_BANK_QUESTIONS_QUERY_KEY, { includeDeleted }],
    apiPath: `${QUESTION_BANK_API}/questions?includeDeleted=${includeDeleted}`,
    responseKey: 'questions',
    collectionName: 'questions',
    enabled: options?.enabled,
    mirrorToLocalCache: false,
  });
}

export function useQuestionBankQuestionsCollection(options?: {
  enabled?: boolean;
  includeDeleted?: boolean;
}): QuestionBankQuestion[] {
  return useQuestionBankQuestions(options).syncedData;
}

export function useQuestionBankTests(options?: { enabled?: boolean }) {
  return useCollectionSync<QuestionBankTest>({
    queryKey: QUESTION_BANK_TESTS_QUERY_KEY,
    apiPath: `${QUESTION_BANK_API}/tests`,
    responseKey: 'tests',
    collectionName: 'tests',
    enabled: options?.enabled,
    mirrorToLocalCache: false,
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
    mirrorToLocalCache: false,
  });
}

export function useQuestionBankResultsCollection(options?: { enabled?: boolean }): QuestionBankResult[] {
  return useQuestionBankResults(options).syncedData;
}

export function useQuestionBankMutations() {
  const queryClient = useQueryClient();

  const invalidateQuestions = () => {
    void queryClient.invalidateQueries({ queryKey: QUESTION_BANK_QUESTIONS_QUERY_KEY });
    void queryClient.invalidateQueries({ queryKey: QUESTION_BANK_METRICS_QUERY_KEY });
  };

  const invalidate = () => {
    invalidateQuestions();
    void queryClient.invalidateQueries({ queryKey: QUESTION_BANK_TESTS_QUERY_KEY });
    void queryClient.invalidateQueries({ queryKey: QUESTION_BANK_RESULTS_QUERY_KEY });
  };

  const replaceQuestions = useMutation({
    mutationFn: async (questions: QuestionBankQuestion[]) =>
      apiJson<{ questions: QuestionBankQuestion[] }>(`${QUESTION_BANK_API}/questions/bulk`, {
        method: 'PUT',
        body: JSON.stringify(questions),
      }),
    onSuccess: () => {
      invalidateQuestions();
    },
  });

  const replaceTests = useMutation({
    mutationFn: async (tests: QuestionBankTest[]) =>
      apiJson<{ tests: QuestionBankTest[] }>(`${QUESTION_BANK_API}/tests/bulk`, {
        method: 'PUT',
        body: JSON.stringify(tests),
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUESTION_BANK_TESTS_QUERY_KEY });
      void queryClient.invalidateQueries({ queryKey: QUESTION_BANK_METRICS_QUERY_KEY });
    },
  });

  const replaceResults = useMutation({
    mutationFn: async (results: QuestionBankResult[]) =>
      apiJson<{ results: QuestionBankResult[] }>(`${QUESTION_BANK_API}/assessment-results/bulk`, {
        method: 'PUT',
        body: JSON.stringify(results),
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUESTION_BANK_RESULTS_QUERY_KEY });
      void queryClient.invalidateQueries({ queryKey: QUESTION_BANK_METRICS_QUERY_KEY });
    },
  });

  const deleteQuestion = useMutation({
    mutationFn: async (id: string) =>
      apiJson<{ success: boolean }>(`${QUESTION_BANK_API}/questions/${encodeURIComponent(id)}`, {
        method: 'DELETE',
      }),
    onSuccess: () => invalidateQuestions(),
  });

  const restoreQuestion = useMutation({
    mutationFn: async (id: string) =>
      apiJson<{ success: boolean }>(
        `${QUESTION_BANK_API}/questions/${encodeURIComponent(id)}/restore`,
        { method: 'POST' },
      ),
    onSuccess: () => invalidateQuestions(),
  });

  const bulkDeleteQuestions = useMutation({
    mutationFn: async (ids: string[]) =>
      apiJson<{ success: boolean; succeeded: number; failed: number }>(
        `${QUESTION_BANK_API}/questions/bulk-delete`,
        { method: 'POST', body: JSON.stringify({ ids }) },
      ),
    onSuccess: () => invalidateQuestions(),
  });

  const bulkRestoreQuestions = useMutation({
    mutationFn: async (ids: string[]) =>
      apiJson<{ success: boolean; succeeded: number; failed: number }>(
        `${QUESTION_BANK_API}/questions/bulk-restore`,
        { method: 'POST', body: JSON.stringify({ ids }) },
      ),
    onSuccess: () => invalidateQuestions(),
  });

  return {
    replaceQuestions,
    replaceTests,
    replaceResults,
    deleteQuestion,
    restoreQuestion,
    bulkDeleteQuestions,
    bulkRestoreQuestions,
    invalidate,
  };
}

export function useQuestionBankMetrics(options?: { enabled?: boolean }) {
  return useServerMetrics<QuestionBankCommandMetricsSnapshot>({
    moduleId: QUESTION_BANK_MODULE_MANIFEST.moduleId,
    apiPath: QUESTION_BANK_MODULE_MANIFEST.restBasePath,
    enabled: options?.enabled,
  });
}
