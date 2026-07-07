import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Exam, ExamResult, ExaminationsCommandMetricsSnapshot } from '@mms/shared';
import { EXAMINATIONS_MODULE_CONTRACT } from '@mms/shared';
import { useServerMetrics } from '@/hooks/useServerMetrics';
import { useAuth } from '@/lib/contexts/AuthContext';
import { apiJson } from '@/lib/apiClient';
import { saveCollection } from '@/lib/db';
import { useSyncedCollection } from '@/hooks/useSyncedCollection';

export const EXAMINATIONS_EXAMS_QUERY_KEY = ['examinations', 'exams', 'list'] as const;
export const EXAMINATIONS_RESULTS_QUERY_KEY = ['examinations', 'results', 'list'] as const;
export const EXAMINATIONS_METRICS_QUERY_KEY = ['examinations', 'metrics', 'snapshot'] as const;

const EXAMINATIONS_API = EXAMINATIONS_MODULE_CONTRACT.restBasePath;

async function fetchExams(): Promise<Exam[]> {
  const examsResponse = await apiJson<{ exams: Exam[] }>(`${EXAMINATIONS_API}/exams`);
  saveCollection('exams', examsResponse.exams);
  return examsResponse.exams;
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
  const queryResult = useExaminationsExams({ enabled });
  return useSyncedCollection<Exam>({
    queryData: queryResult.data,
    isSuccess: queryResult.isSuccess,
    collectionName: 'exams',
    enabled,
  });
}

async function fetchExamResults(): Promise<ExamResult[]> {
  const resultsResponse = await apiJson<{ results: ExamResult[] }>(`${EXAMINATIONS_API}/results`);
  saveCollection('exam_results', resultsResponse.results);
  return resultsResponse.results;
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
  const queryResult = useExaminationsResults({ enabled });
  return useSyncedCollection<ExamResult>({
    queryData: queryResult.data,
    isSuccess: queryResult.isSuccess,
    collectionName: 'exam_results',
    enabled,
  });
}

export function useExaminationsMetrics(options?: { enabled?: boolean }) {
  return useServerMetrics<ExaminationsCommandMetricsSnapshot>({
    moduleId: EXAMINATIONS_MODULE_CONTRACT.moduleId,
    apiPath: EXAMINATIONS_MODULE_CONTRACT.restBasePath,
    enabled: options?.enabled,
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
    onSuccess: (response) => {
      saveCollection('exams', response.exams);
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
    onSuccess: (response) => {
      saveCollection('exam_results', response.results);
      void queryClient.invalidateQueries({ queryKey: EXAMINATIONS_RESULTS_QUERY_KEY });
      void queryClient.invalidateQueries({ queryKey: EXAMINATIONS_METRICS_QUERY_KEY });
    },
  });

  return {
    replaceExams,
    replaceExamResults,
  };
}
