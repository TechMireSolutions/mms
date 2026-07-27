import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { Exam, ExamResult, ExaminationsCommandMetricsSnapshot } from '@mms/shared';
import { EXAMINATIONS_MODULE_MANIFEST } from '@mms/shared';
import { useServerMetrics } from '@/hooks/useServerMetrics';
import { apiJson } from '@/lib/apiClient';
import { saveCollection } from '@/lib/db';
import { useCollectionSync } from '@/hooks/useCollectionSync';

export const EXAMINATIONS_EXAMS_QUERY_KEY = ['examinations', 'exams', 'list'] as const;
export const EXAMINATIONS_RESULTS_QUERY_KEY = ['examinations', 'results', 'list'] as const;
export const EXAMINATIONS_METRICS_QUERY_KEY = ['examinations', 'metrics', 'snapshot'] as const;

const EXAMINATIONS_API = EXAMINATIONS_MODULE_MANIFEST.restBasePath;

export class NotifiedExaminationsMutationError extends Error {}

export function useExaminationsExams(options?: { enabled?: boolean; includeDeleted?: boolean }) {
  const includeDeleted = options?.includeDeleted ?? false;
  return useCollectionSync<Exam>({
    queryKey: [...EXAMINATIONS_EXAMS_QUERY_KEY, { includeDeleted }],
    apiPath: `${EXAMINATIONS_API}/exams?includeDeleted=${includeDeleted}`,
    responseKey: 'exams',
    collectionName: 'exams',
    enabled: options?.enabled,
  });
}

export function useExaminationsExamsCollection(options?: {
  enabled?: boolean;
  includeDeleted?: boolean;
}): Exam[] {
  return useExaminationsExams(options).syncedData;
}

export function useExaminationsResults(options?: { enabled?: boolean }) {
  return useCollectionSync<ExamResult>({
    queryKey: EXAMINATIONS_RESULTS_QUERY_KEY,
    apiPath: `${EXAMINATIONS_API}/results`,
    responseKey: 'results',
    collectionName: 'exam_results',
    enabled: options?.enabled,
  });
}

export function useExaminationsResultsCollection(options?: { enabled?: boolean }): ExamResult[] {
  return useExaminationsResults(options).syncedData;
}

export function useExaminationsMetrics(options?: { enabled?: boolean }) {
  return useServerMetrics<ExaminationsCommandMetricsSnapshot>({
    moduleId: EXAMINATIONS_MODULE_MANIFEST.moduleId,
    apiPath: EXAMINATIONS_MODULE_MANIFEST.restBasePath,
    enabled: options?.enabled,
  });
}

export function useExaminationsMutations() {
  const queryClient = useQueryClient();

  const invalidateExams = () => {
    void queryClient.invalidateQueries({ queryKey: EXAMINATIONS_EXAMS_QUERY_KEY });
    void queryClient.invalidateQueries({ queryKey: EXAMINATIONS_METRICS_QUERY_KEY });
  };

  const replaceExams = useMutation({
    mutationFn: async (exams: Exam[]) =>
      apiJson<{ exams: Exam[] }>(`${EXAMINATIONS_API}/exams/bulk`, {
        method: 'PUT',
        body: JSON.stringify(exams),
      }),
    onSuccess: (response) => {
      saveCollection('exams', response.exams);
      invalidateExams();
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

  const deleteExam = useMutation({
    mutationFn: async (id: string) =>
      apiJson<{ success: boolean }>(`${EXAMINATIONS_API}/exams/${encodeURIComponent(id)}`, {
        method: 'DELETE',
      }),
    onSuccess: () => invalidateExams(),
  });

  const restoreExam = useMutation({
    mutationFn: async (id: string) =>
      apiJson<{ success: boolean }>(
        `${EXAMINATIONS_API}/exams/${encodeURIComponent(id)}/restore`,
        { method: 'POST' },
      ),
    onSuccess: () => invalidateExams(),
  });

  const bulkDeleteExams = useMutation({
    mutationFn: async (ids: string[]) =>
      apiJson<{ success: boolean; succeeded: number; failed: number }>(
        `${EXAMINATIONS_API}/exams/bulk-delete`,
        { method: 'POST', body: JSON.stringify({ ids }) },
      ),
    onSuccess: () => invalidateExams(),
  });

  const bulkRestoreExams = useMutation({
    mutationFn: async (ids: string[]) =>
      apiJson<{ success: boolean; succeeded: number; failed: number }>(
        `${EXAMINATIONS_API}/exams/bulk-restore`,
        { method: 'POST', body: JSON.stringify({ ids }) },
      ),
    onSuccess: () => invalidateExams(),
  });

  return {
    replaceExams,
    replaceExamResults,
    deleteExam,
    restoreExam,
    bulkDeleteExams,
    bulkRestoreExams,
  };
}
