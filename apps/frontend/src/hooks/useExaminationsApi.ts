import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Exam, ExamResult, ModuleColumnPref, ExaminationsCommandMetricsSnapshot } from '@mms/shared';
import { EXAMINATIONS_MODULE_CONTRACT } from '@mms/shared';
import { useAuth } from '@/lib/contexts/AuthContext';
import { apiJson } from '@/lib/apiClient';
import { getCollection, saveCollection } from '@/lib/db';
import { useLiveCollection } from '@/hooks/useLiveCollection';

export const EXAMINATIONS_EXAMS_QUERY_KEY = ['examinations', 'exams', 'list'] as const;
export const EXAMINATIONS_RESULTS_QUERY_KEY = ['examinations', 'results', 'list'] as const;
export const EXAMINATIONS_METRICS_QUERY_KEY = ['examinations', 'metrics', 'snapshot'] as const;

export const EXAMINATIONS_EXAM_COLUMN_PREFS_QUERY_KEY = [
  EXAMINATIONS_MODULE_CONTRACT.collectionKey,
  'column-prefs',
] as const;

export const EXAMINATIONS_RESULTS_COLUMN_PREFS_QUERY_KEY = [
  EXAMINATIONS_MODULE_CONTRACT.resultsCollectionKey,
  'column-prefs',
] as const;

const EXAMINATIONS_API = EXAMINATIONS_MODULE_CONTRACT.restBasePath;

async function fetchExams(): Promise<Exam[]> {
  const body = await apiJson<{ exams: Exam[] }>(`${EXAMINATIONS_API}/exams`);
  saveCollection('exams', body.exams);
  return getCollection<Exam>('exams', []);
}

async function fetchExamResults(): Promise<ExamResult[]> {
  const body = await apiJson<{ results: ExamResult[] }>(`${EXAMINATIONS_API}/results`);
  saveCollection('exam_results', body.results);
  return getCollection<ExamResult>('exam_results', []);
}

export function useExaminationsExams(options?: { enabled?: boolean }) {
  const queryEnabled = options?.enabled ?? true;
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: EXAMINATIONS_EXAMS_QUERY_KEY,
    queryFn: fetchExams,
    enabled: isAuthenticated && queryEnabled,
    staleTime: 30_000,
  });
}

export function useExaminationsExamsCollection(options?: { enabled?: boolean }): Exam[] {
  const enabled = options?.enabled ?? true;
  const { data: fromQuery = [] } = useExaminationsExams({ enabled });
  const fromLocal = useLiveCollection<Exam>('exams', [], { enabled });
  if (!enabled) return [];
  if (fromQuery.length > 0) {
    return fromQuery;
  }
  return fromLocal;
}

export function useExaminationsResults(options?: { enabled?: boolean }) {
  const queryEnabled = options?.enabled ?? true;
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: EXAMINATIONS_RESULTS_QUERY_KEY,
    queryFn: fetchExamResults,
    enabled: isAuthenticated && queryEnabled,
    staleTime: 30_000,
  });
}

export function useExaminationsResultsCollection(options?: { enabled?: boolean }): ExamResult[] {
  const enabled = options?.enabled ?? true;
  const { data: fromQuery = [] } = useExaminationsResults({ enabled });
  const fromLocal = useLiveCollection<ExamResult>('exam_results', [], { enabled });
  if (!enabled) return [];
  if (fromQuery.length > 0) {
    return fromQuery;
  }
  return fromLocal;
}

export function useExaminationsMetrics() {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: EXAMINATIONS_METRICS_QUERY_KEY,
    queryFn: async () => {
      const body = await apiJson<{ metrics: ExaminationsCommandMetricsSnapshot }>(`${EXAMINATIONS_API}/metrics`);
      return body.metrics;
    },
    enabled: isAuthenticated,
    staleTime: 30_000,
  });
}

export function useExaminationsMutations() {
  const queryClient = useQueryClient();

  const replaceExams = useMutation({
    mutationFn: async (exams: Exam[]) =>
      apiJson<{ exams: Exam[] }>(`${EXAMINATIONS_API}/exams/bulk`, {
        method: 'PUT',
        body: JSON.stringify(exams),
      }),
    onSuccess: (data) => {
      saveCollection('exams', data.exams);
      void queryClient.invalidateQueries({ queryKey: EXAMINATIONS_EXAMS_QUERY_KEY });
      void queryClient.invalidateQueries({ queryKey: EXAMINATIONS_METRICS_QUERY_KEY });
    },
  });

  const replaceExamResults = useMutation({
    mutationFn: async (results: ExamResult[]) =>
      apiJson<{ results: ExamResult[] }>(`${EXAMINATIONS_API}/results/bulk`, {
        method: 'PUT',
        body: JSON.stringify(results),
      }),
    onSuccess: (data) => {
      saveCollection('exam_results', data.results);
      void queryClient.invalidateQueries({ queryKey: EXAMINATIONS_RESULTS_QUERY_KEY });
      void queryClient.invalidateQueries({ queryKey: EXAMINATIONS_METRICS_QUERY_KEY });
    },
  });

  return {
    replaceExams,
    replaceExamResults,
  };
}

export function useExaminationExamColumnPreferences() {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: EXAMINATIONS_EXAM_COLUMN_PREFS_QUERY_KEY,
    queryFn: async () => {
      const body = await apiJson<{ prefs: ModuleColumnPref[] }>(`${EXAMINATIONS_API}/exams/column-preferences`);
      return body.prefs;
    },
    enabled: isAuthenticated,
    staleTime: 60_000,
  });
}

export function useExaminationExamColumnPreferencesMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (prefs: ModuleColumnPref[]) =>
      apiJson<{ success: boolean; prefs: ModuleColumnPref[] }>(`${EXAMINATIONS_API}/exams/column-preferences`, {
        method: 'PUT',
        body: JSON.stringify({ prefs }),
      }),
    onSuccess: (data) => {
      queryClient.setQueryData(EXAMINATIONS_EXAM_COLUMN_PREFS_QUERY_KEY, data.prefs);
    },
  });
}

export function useExaminationResultsColumnPreferences() {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: EXAMINATIONS_RESULTS_COLUMN_PREFS_QUERY_KEY,
    queryFn: async () => {
      const body = await apiJson<{ prefs: ModuleColumnPref[] }>(`${EXAMINATIONS_API}/results/column-preferences`);
      return body.prefs;
    },
    enabled: isAuthenticated,
    staleTime: 60_000,
  });
}

export function useExaminationResultsColumnPreferencesMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (prefs: ModuleColumnPref[]) =>
      apiJson<{ success: boolean; prefs: ModuleColumnPref[] }>(`${EXAMINATIONS_API}/results/column-preferences`, {
        method: 'PUT',
        body: JSON.stringify({ prefs }),
      }),
    onSuccess: (data) => {
      queryClient.setQueryData(EXAMINATIONS_RESULTS_COLUMN_PREFS_QUERY_KEY, data.prefs);
    },
  });
}
