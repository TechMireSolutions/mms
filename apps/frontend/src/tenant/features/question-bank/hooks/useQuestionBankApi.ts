import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  ModuleColumnPref,
  QuestionBankCommandMetricsSnapshot,
  QuestionBankQuestion,
  QuestionBankTest,
  QuestionBankResult,
} from '@mms/shared';
import { QUESTION_BANK_MODULE_CONTRACT } from '@mms/shared';
import { useAuth } from '@/lib/contexts/AuthContext';
import { apiJson } from '@/lib/apiClient';
import { saveCollection } from '@/lib/db';
import { useLiveCollection } from '@/hooks/useLiveCollection';
import { readModuleColumnPreferences, writeModuleColumnPreferences, type ModuleColumnPreferencesResponse } from '@/lib/moduleColumnPreferencesApi';

const QUESTION_BANK_API = QUESTION_BANK_MODULE_CONTRACT.restBasePath;

export const QUESTION_BANK_METRICS_QUERY_KEY = [QUESTION_BANK_MODULE_CONTRACT.moduleId, 'metrics'] as const;

export const QUESTION_BANK_COLUMN_PREFS_QUERY_KEY = [
  QUESTION_BANK_MODULE_CONTRACT.moduleId,
  'column-preferences',
] as const;

export const QUESTION_BANK_QUESTIONS_QUERY_KEY = [QUESTION_BANK_MODULE_CONTRACT.moduleId, 'questions', 'list'] as const;
export const QUESTION_BANK_TESTS_QUERY_KEY = [QUESTION_BANK_MODULE_CONTRACT.moduleId, 'tests', 'list'] as const;
export const QUESTION_BANK_RESULTS_QUERY_KEY = [QUESTION_BANK_MODULE_CONTRACT.moduleId, 'results', 'list'] as const;

async function fetchQuestions(): Promise<QuestionBankQuestion[]> {
  const questionsResponse = await apiJson<{ questions: QuestionBankQuestion[] }>(`${QUESTION_BANK_API}/questions`);
  saveCollection('questions', questionsResponse.questions);
  return questionsResponse.questions;
}

export function useQuestionBankQuestions(options?: { enabled?: boolean }) {
  const queryEnabled = options?.enabled ?? true;
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: QUESTION_BANK_QUESTIONS_QUERY_KEY,
    queryFn: fetchQuestions,
    enabled: isAuthenticated && queryEnabled,
    staleTime: 30_000,
  });
}

export function useQuestionBankQuestionsCollection(options?: { enabled?: boolean }): QuestionBankQuestion[] {
  const enabled = options?.enabled ?? true;
  const { data: queryQuestions, isSuccess } = useQuestionBankQuestions({ enabled });
  const localQuestions = useLiveCollection<QuestionBankQuestion>('questions', [], { enabled });
  if (!enabled) return [];
  if (isSuccess && queryQuestions) {
    return queryQuestions;
  }
  return localQuestions;
}

async function fetchTests(): Promise<QuestionBankTest[]> {
  const testsResponse = await apiJson<{ tests: QuestionBankTest[] }>(`${QUESTION_BANK_API}/tests`);
  saveCollection('tests', testsResponse.tests);
  return testsResponse.tests;
}

export function useQuestionBankTests(options?: { enabled?: boolean }) {
  const queryEnabled = options?.enabled ?? true;
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: QUESTION_BANK_TESTS_QUERY_KEY,
    queryFn: fetchTests,
    enabled: isAuthenticated && queryEnabled,
    staleTime: 30_000,
  });
}

export function useQuestionBankTestsCollection(options?: { enabled?: boolean }): QuestionBankTest[] {
  const enabled = options?.enabled ?? true;
  const { data: queryTests, isSuccess } = useQuestionBankTests({ enabled });
  const localTests = useLiveCollection<QuestionBankTest>('tests', [], { enabled });
  if (!enabled) return [];
  if (isSuccess && queryTests) {
    return queryTests;
  }
  return localTests;
}

async function fetchResults(): Promise<QuestionBankResult[]> {
  const resultsResponse = await apiJson<{ results: QuestionBankResult[] }>(`${QUESTION_BANK_API}/assessment-results`);
  saveCollection('assessment_results', resultsResponse.results);
  return resultsResponse.results;
}

export function useQuestionBankResults(options?: { enabled?: boolean }) {
  const queryEnabled = options?.enabled ?? true;
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: QUESTION_BANK_RESULTS_QUERY_KEY,
    queryFn: fetchResults,
    enabled: isAuthenticated && queryEnabled,
    staleTime: 30_000,
  });
}

export function useQuestionBankResultsCollection(options?: { enabled?: boolean }): QuestionBankResult[] {
  const enabled = options?.enabled ?? true;
  const { data: queryResults, isSuccess } = useQuestionBankResults({ enabled });
  const localResults = useLiveCollection<QuestionBankResult>('assessment_results', [], { enabled });
  if (!enabled) return [];
  if (isSuccess && queryResults) {
    return queryResults;
  }
  return localResults;
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

export function useQuestionBankMetrics() {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: QUESTION_BANK_METRICS_QUERY_KEY,
    queryFn: async () => {
      const metricsResponse = await apiJson<{ metrics: QuestionBankCommandMetricsSnapshot }>(`${QUESTION_BANK_API}/metrics`);
      return metricsResponse.metrics;
    },
    enabled: isAuthenticated,
    staleTime: 30_000,
  });
}

export function useQuestionBankColumnPrefs() {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: QUESTION_BANK_COLUMN_PREFS_QUERY_KEY,
    queryFn: async () => {
      const preferencesResponse = await apiJson<ModuleColumnPreferencesResponse>(`${QUESTION_BANK_API}/column-preferences`);
      return readModuleColumnPreferences(preferencesResponse);
    },
    enabled: isAuthenticated,
    staleTime: 60_000,
  });
}

export function useQuestionBankColumnPrefsMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (preferences: ModuleColumnPref[]) =>
      apiJson<ModuleColumnPreferencesResponse>(`${QUESTION_BANK_API}/column-preferences`, {
        method: 'PUT',
        body: writeModuleColumnPreferences(preferences),
      }),
    onSuccess: (preferencesResponse) => {
      queryClient.setQueryData(QUESTION_BANK_COLUMN_PREFS_QUERY_KEY, readModuleColumnPreferences(preferencesResponse));
    },
  });
}
