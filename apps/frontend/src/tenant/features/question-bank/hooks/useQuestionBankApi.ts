import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  QuestionBankCommandMetricsSnapshot,
  QuestionBankQuestion,
  QuestionBankTest,
  QuestionBankResult,
} from '@mms/shared';
import { QUESTION_BANK_MODULE_MANIFEST } from '@mms/shared';
import { useServerMetrics } from '@/hooks/useServerMetrics';
import { apiJson } from '@/lib/apiClient';
import { useAuth } from '@/lib/contexts/AuthContext';
import { createModulePaginatedListQuery } from '@/lib/query/createModulePaginatedListQuery';
import {
  buildQuestionBankPageUrl,
  questionBankPaginatedQueryKey,
  questionBankListQueryKeyParams,
  sameQuestionBankListFilters,
  type QuestionBankPaginatedParams,
  type QuestionBankListPageResult,
} from '@/tenant/features/question-bank/hooks/questionBankListQueryBuilders';

export const QUESTION_BANK_API = QUESTION_BANK_MODULE_MANIFEST.restBasePath;

export const QUESTION_BANK_METRICS_QUERY_KEY = [QUESTION_BANK_MODULE_MANIFEST.moduleId, 'metrics'] as const;

export const QUESTION_BANK_QUESTIONS_QUERY_KEY = [QUESTION_BANK_MODULE_MANIFEST.moduleId, 'questions', 'list'] as const;
export const QUESTION_BANK_TESTS_QUERY_KEY = [QUESTION_BANK_MODULE_MANIFEST.moduleId, 'tests', 'list'] as const;
export const QUESTION_BANK_RESULTS_QUERY_KEY = [QUESTION_BANK_MODULE_MANIFEST.moduleId, 'results', 'list'] as const;

export function useQuestionBankQuestions(options?: { enabled?: boolean; includeDeleted?: boolean }) {
  const { isAuthenticated } = useAuth();
  const includeDeleted = options?.includeDeleted ?? false;
  return useQuery<QuestionBankQuestion[]>({
    queryKey: [...QUESTION_BANK_QUESTIONS_QUERY_KEY, { includeDeleted }],
    queryFn: async ({ signal }) => {
      const res = await apiJson<{ questions: QuestionBankQuestion[] }>(
        `${QUESTION_BANK_API}/questions?includeDeleted=${includeDeleted}`,
        { signal },
      );
      return res?.questions ?? [];
    },
    enabled: isAuthenticated && (options?.enabled ?? true),
    staleTime: 30_000,
  });
}

export function useQuestionBankQuestionsCollection(options?: {
  enabled?: boolean;
  includeDeleted?: boolean;
}): QuestionBankQuestion[] {
  return useQuestionBankQuestions(options).data ?? [];
}

/** SQL-paged questions Work list (server-side search/category/difficulty/soft-delete). */
export const useQuestionBankPaginated = createModulePaginatedListQuery<
  QuestionBankListPageResult,
  QuestionBankPaginatedParams,
  ReturnType<typeof questionBankListQueryKeyParams>
>({
  queryKey: questionBankPaginatedQueryKey,
  keyParams: questionBankListQueryKeyParams,
  sameFilters: sameQuestionBankListFilters,
  buildUrl: buildQuestionBankPageUrl,
});

export function useQuestionBankTests(options?: { enabled?: boolean }) {
  const { isAuthenticated } = useAuth();
  return useQuery<QuestionBankTest[]>({
    queryKey: QUESTION_BANK_TESTS_QUERY_KEY,
    queryFn: async ({ signal }) => {
      const res = await apiJson<{ tests: QuestionBankTest[] }>(
        `${QUESTION_BANK_API}/tests`,
        { signal },
      );
      return res?.tests ?? [];
    },
    enabled: isAuthenticated && (options?.enabled ?? true),
    staleTime: 30_000,
  });
}

export function useQuestionBankTestsCollection(options?: { enabled?: boolean }): QuestionBankTest[] {
  return useQuestionBankTests(options).data ?? [];
}

export function useQuestionBankResults(options?: { enabled?: boolean }) {
  const { isAuthenticated } = useAuth();
  return useQuery<QuestionBankResult[]>({
    queryKey: QUESTION_BANK_RESULTS_QUERY_KEY,
    queryFn: async ({ signal }) => {
      const res = await apiJson<{ results: QuestionBankResult[] }>(
        `${QUESTION_BANK_API}/assessment-results`,
        { signal },
      );
      return res?.results ?? [];
    },
    enabled: isAuthenticated && (options?.enabled ?? true),
    staleTime: 30_000,
  });
}

export function useQuestionBankResultsCollection(options?: { enabled?: boolean }): QuestionBankResult[] {
  return useQuestionBankResults(options).data ?? [];
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
