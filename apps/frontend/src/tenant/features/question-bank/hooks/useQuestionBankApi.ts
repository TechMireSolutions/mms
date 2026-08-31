import { useQueryClient } from '@tanstack/react-query';
import type { MutateOptions } from '@tanstack/react-query';
import type {
  QuestionBankCommandMetricsSnapshot,
  QuestionBankQuestion,
  QuestionBankTest,
  QuestionBankResult,
  QuestionBankReportQuery,
} from '@mms/shared';
import { QUESTION_BANK_MODULE_MANIFEST } from '@mms/shared';
import { useServerMetrics } from '@/hooks/useServerMetrics';
import { useAuth } from '@/lib/contexts/AuthContext';
import { tsrClient } from '@/lib/api';




export const QUESTION_BANK_API = QUESTION_BANK_MODULE_MANIFEST.restBasePath;

export const QUESTION_BANK_METRICS_QUERY_KEY = [QUESTION_BANK_MODULE_MANIFEST.moduleId, 'metrics'] as const;

export const QUESTION_BANK_QUESTIONS_QUERY_KEY = [QUESTION_BANK_MODULE_MANIFEST.moduleId, 'questions', 'list'] as const;
export const QUESTION_BANK_TESTS_QUERY_KEY = [QUESTION_BANK_MODULE_MANIFEST.moduleId, 'tests', 'list'] as const;
export const QUESTION_BANK_RESULTS_QUERY_KEY = [QUESTION_BANK_MODULE_MANIFEST.moduleId, 'results', 'list'] as const;

export function useQuestionBankQuestions(options?: { enabled?: boolean; includeDeleted?: boolean }) {
  const { isAuthenticated } = useAuth();
  const includeDeleted = options?.includeDeleted ?? false;
  const enabled = options?.enabled ?? true;
  // @ts-expect-error - TS union discrimination limit with ts-rest
  return tsrClient.questionBank.listQuestions.useQuery({
    queryKey: [...QUESTION_BANK_QUESTIONS_QUERY_KEY, { includeDeleted }],
    queryData: { query: { includeDeleted: includeDeleted ? 'true' : undefined } },
    enabled: isAuthenticated && enabled,
    staleTime: 30_000,
  });
}

export function useQuestionBankQuestionsCollection(options?: {
  enabled?: boolean;
  includeDeleted?: boolean;
}): QuestionBankQuestion[] {
  const query = useQuestionBankQuestions(options);
  if (!query.data || query.data.status !== 200) return [];
  const body = query.data.body;
  if (Array.isArray(body)) return body as QuestionBankQuestion[];
  if (body && typeof body === 'object' && 'questions' in body && Array.isArray(body.questions)) {
    return body.questions as QuestionBankQuestion[];
  }
  return [];
}

export function useQuestionBankTests(options?: { enabled?: boolean }) {
  const { isAuthenticated } = useAuth();
  const enabled = options?.enabled ?? true;
  // @ts-expect-error - TS union discrimination limit with ts-rest
  return tsrClient.questionBank.listTests.useQuery({
    queryKey: QUESTION_BANK_TESTS_QUERY_KEY,
    enabled: isAuthenticated && enabled,
    staleTime: 30_000,
  });
}

export function useQuestionBankTestsCollection(options?: { enabled?: boolean }): QuestionBankTest[] {
  const query = useQuestionBankTests(options);
  if (!query.data || query.data.status !== 200) return [];
  const body = query.data.body;
  if (Array.isArray(body)) return body as QuestionBankTest[];
  if (body && typeof body === 'object' && 'tests' in body && Array.isArray(body.tests)) {
    return body.tests as QuestionBankTest[];
  }
  return [];
}

export function useQuestionBankResults(options?: { enabled?: boolean }) {
  const { isAuthenticated } = useAuth();
  const enabled = options?.enabled ?? true;
  // @ts-expect-error - TS union discrimination limit with ts-rest
  return tsrClient.questionBank.listResults.useQuery({
    queryKey: QUESTION_BANK_RESULTS_QUERY_KEY,
    enabled: isAuthenticated && enabled,
    staleTime: 30_000,
  });
}

export function useQuestionBankResultsCollection(options?: { enabled?: boolean }): QuestionBankResult[] {
  const query = useQuestionBankResults(options);
  if (!query.data || query.data.status !== 200) return [];
  const body = query.data.body;
  if (Array.isArray(body)) return body as QuestionBankResult[];
  if (body && typeof body === 'object' && 'results' in body && Array.isArray(body.results)) {
    return body.results as QuestionBankResult[];
  }
  return [];
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

  // @ts-expect-error - TS union discrimination limit with ts-rest
  const replaceQuestions = tsrClient.questionBank.bulkUpdateQuestions.useMutation({
    onSuccess: () => {
      invalidateQuestions();
    },
  });

  // @ts-expect-error - TS union discrimination limit with ts-rest
  const replaceTests = tsrClient.questionBank.bulkUpdateTests.useMutation({
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUESTION_BANK_TESTS_QUERY_KEY });
      void queryClient.invalidateQueries({ queryKey: QUESTION_BANK_METRICS_QUERY_KEY });
    },
  });

  // @ts-expect-error - TS union discrimination limit with ts-rest
  const replaceResults = tsrClient.questionBank.bulkUpdateResults.useMutation({
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUESTION_BANK_RESULTS_QUERY_KEY });
      void queryClient.invalidateQueries({ queryKey: QUESTION_BANK_METRICS_QUERY_KEY });
    },
  });

  // @ts-expect-error - TS union discrimination limit with ts-rest
  const deleteQuestion = tsrClient.questionBank.deleteQuestion.useMutation({
    onSuccess: () => invalidateQuestions(),
  });

  // @ts-expect-error - TS union discrimination limit with ts-rest
  const restoreQuestion = tsrClient.questionBank.restoreQuestion.useMutation({
    onSuccess: () => invalidateQuestions(),
  });

  // @ts-expect-error - TS union discrimination limit with ts-rest
  const bulkDeleteQuestions = tsrClient.questionBank.bulkDeleteQuestions.useMutation({
    onSuccess: () => invalidateQuestions(),
  });

  // @ts-expect-error - TS union discrimination limit with ts-rest
  const bulkRestoreQuestions = tsrClient.questionBank.bulkRestoreQuestions.useMutation({
    onSuccess: () => invalidateQuestions(),
  });

  return {
    replaceQuestions: {
      ...replaceQuestions,
      mutate: (questions: QuestionBankQuestion[], opts?: MutateOptions) => replaceQuestions.mutate({ body: questions }, opts),
      mutateAsync: (questions: QuestionBankQuestion[]) => replaceQuestions.mutateAsync({ body: questions }),
    },
    replaceTests: {
      ...replaceTests,
      mutate: (tests: QuestionBankTest[], opts?: MutateOptions) => replaceTests.mutate({ body: tests }, opts),
      mutateAsync: (tests: QuestionBankTest[]) => replaceTests.mutateAsync({ body: tests }),
    },
    replaceResults: {
      ...replaceResults,
      mutate: (results: QuestionBankResult[], opts?: MutateOptions) => replaceResults.mutate({ body: results }, opts),
      mutateAsync: (results: QuestionBankResult[]) => replaceResults.mutateAsync({ body: results }),
    },
    deleteQuestion: {
      ...deleteQuestion,
      mutate: (id: string, opts?: MutateOptions) => deleteQuestion.mutate({ params: { id } }, opts),
      mutateAsync: (id: string) => deleteQuestion.mutateAsync({ params: { id } }),
    },
    restoreQuestion: {
      ...restoreQuestion,
      mutate: (id: string, opts?: MutateOptions) => restoreQuestion.mutate({ params: { id } }, opts),
      mutateAsync: (id: string) => restoreQuestion.mutateAsync({ params: { id } }),
    },
    bulkDeleteQuestions: {
      ...bulkDeleteQuestions,
      mutate: (ids: string[], opts?: MutateOptions) => bulkDeleteQuestions.mutate({ body: { ids } }, opts),
      mutateAsync: (ids: string[]) => bulkDeleteQuestions.mutateAsync({ body: { ids } }),
    },
    bulkRestoreQuestions: {
      ...bulkRestoreQuestions,
      mutate: (ids: string[], opts?: MutateOptions) => bulkRestoreQuestions.mutate({ body: { ids } }, opts),
      mutateAsync: (ids: string[]) => bulkRestoreQuestions.mutateAsync({ body: { ids } }),
    },
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

export const QUESTION_BANK_REPORT_AGGREGATES_QUERY_KEY = [QUESTION_BANK_MODULE_MANIFEST.moduleId, 'reports', 'aggregates'] as const;

export function useQuestionBankReportAggregates(
  filters?: QuestionBankReportQuery,
  options?: { enabled?: boolean },
) {
  const { isAuthenticated } = useAuth();
  const enabled = options?.enabled ?? true;
  // @ts-expect-error - TS union discrimination limit with ts-rest
  return tsrClient.questionBank.reportAggregates.useQuery({
    queryKey: [...QUESTION_BANK_REPORT_AGGREGATES_QUERY_KEY, filters ?? {}],
    queryData: { query: filters },
    enabled: isAuthenticated && enabled,
    staleTime: 5 * 60 * 1000,
  });
}

