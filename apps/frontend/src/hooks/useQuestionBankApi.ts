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
import { getCollection, saveCollection } from '@/lib/db';
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
  const body = await apiJson<{ questions: QuestionBankQuestion[] }>(`${QUESTION_BANK_API}/questions`);
  saveCollection('questions', body.questions);
  return getCollection<QuestionBankQuestion>('questions', []);
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
  const { data: fromQuery = [] } = useQuestionBankQuestions({ enabled });
  const fromLocal = useLiveCollection<QuestionBankQuestion>('questions', [], { enabled });
  if (!enabled) return [];
  if (fromQuery.length > 0) {
    return fromQuery;
  }
  return fromLocal;
}

async function fetchTests(): Promise<QuestionBankTest[]> {
  const body = await apiJson<{ tests: QuestionBankTest[] }>(`${QUESTION_BANK_API}/tests`);
  saveCollection('tests', body.tests);
  return getCollection<QuestionBankTest>('tests', []);
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
  const { data: fromQuery = [] } = useQuestionBankTests({ enabled });
  const fromLocal = useLiveCollection<QuestionBankTest>('tests', [], { enabled });
  if (!enabled) return [];
  if (fromQuery.length > 0) {
    return fromQuery;
  }
  return fromLocal;
}

async function fetchResults(): Promise<QuestionBankResult[]> {
  const body = await apiJson<{ results: QuestionBankResult[] }>(`${QUESTION_BANK_API}/assessment-results`);
  saveCollection('assessment_results', body.results);
  return getCollection<QuestionBankResult>('assessment_results', []);
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
  const { data: fromQuery = [] } = useQuestionBankResults({ enabled });
  const fromLocal = useLiveCollection<QuestionBankResult>('assessment_results', [], { enabled });
  if (!enabled) return [];
  if (fromQuery.length > 0) {
    return fromQuery;
  }
  return fromLocal;
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
    onSuccess: (data) => {
      saveCollection('questions', data.questions);
      invalidate();
    },
  });

  const replaceTests = useMutation({
    mutationFn: async (tests: QuestionBankTest[]) =>
      apiJson<{ tests: QuestionBankTest[] }>(`${QUESTION_BANK_API}/tests/bulk`, {
        method: 'PUT',
        body: JSON.stringify(tests),
      }),
    onSuccess: (data) => {
      saveCollection('tests', data.tests);
      invalidate();
    },
  });

  const replaceResults = useMutation({
    mutationFn: async (results: QuestionBankResult[]) =>
      apiJson<{ results: QuestionBankResult[] }>(`${QUESTION_BANK_API}/assessment-results/bulk`, {
        method: 'PUT',
        body: JSON.stringify(results),
      }),
    onSuccess: (data) => {
      saveCollection('assessment_results', data.results);
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
      const body = await apiJson<{ metrics: QuestionBankCommandMetricsSnapshot }>(`${QUESTION_BANK_API}/metrics`);
      return body.metrics;
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
      const body = await apiJson<ModuleColumnPreferencesResponse>(`${QUESTION_BANK_API}/column-preferences`);
      return readModuleColumnPreferences(body);
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
    onSuccess: (data) => {
      queryClient.setQueryData(QUESTION_BANK_COLUMN_PREFS_QUERY_KEY, readModuleColumnPreferences(data));
    },
  });
}
