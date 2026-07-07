import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { Exam, ExamResult, ExaminationsCommandMetricsSnapshot } from '@mms/shared';
import { EXAMINATIONS_MODULE_CONTRACT } from '@mms/shared';
import { useServerMetrics } from '@/hooks/useServerMetrics';
import { apiJson } from '@/lib/apiClient';
import { saveCollection } from '@/lib/db';
import { useCollectionSync } from '@/hooks/useCollectionSync';

export const EXAMINATIONS_EXAMS_QUERY_KEY = ['examinations', 'exams', 'list'] as const;
export const EXAMINATIONS_RESULTS_QUERY_KEY = ['examinations', 'results', 'list'] as const;
export const EXAMINATIONS_METRICS_QUERY_KEY = ['examinations', 'metrics', 'snapshot'] as const;

const EXAMINATIONS_API = EXAMINATIONS_MODULE_CONTRACT.restBasePath;

export function useExaminationsExams(options?: { enabled?: boolean }) {
  return useCollectionSync<Exam>({
    queryKey: EXAMINATIONS_EXAMS_QUERY_KEY,
    apiPath: `${EXAMINATIONS_API}/exams`,
    responseKey: 'exams',
    collectionName: 'exams',
    enabled: options?.enabled,
  }).queryResult;
}

export function useExaminationsExamsCollection(options?: { enabled?: boolean }): Exam[] {
  return useCollectionSync<Exam>({
    queryKey: EXAMINATIONS_EXAMS_QUERY_KEY,
    apiPath: `${EXAMINATIONS_API}/exams`,
    responseKey: 'exams',
    collectionName: 'exams',
    enabled: options?.enabled,
  }).syncedData;
}

export function useExaminationsResults(options?: { enabled?: boolean }) {
  return useCollectionSync<ExamResult>({
    queryKey: EXAMINATIONS_RESULTS_QUERY_KEY,
    apiPath: `${EXAMINATIONS_API}/results`,
    responseKey: 'results',
    collectionName: 'exam_results',
    enabled: options?.enabled,
  }).queryResult;
}

export function useExaminationsResultsCollection(options?: { enabled?: boolean }): ExamResult[] {
  return useCollectionSync<ExamResult>({
    queryKey: EXAMINATIONS_RESULTS_QUERY_KEY,
    apiPath: `${EXAMINATIONS_API}/results`,
    responseKey: 'results',
    collectionName: 'exam_results',
    enabled: options?.enabled,
  }).syncedData;
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
