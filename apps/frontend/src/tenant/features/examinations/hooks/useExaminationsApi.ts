import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Exam, ExamResult, ExaminationsCommandMetricsSnapshot } from '@mms/shared';
import { EXAMINATIONS_MODULE_MANIFEST } from '@mms/shared';
import { useServerMetrics } from '@/hooks/useServerMetrics';
import { apiJson } from '@/lib/apiClient';
import { useAuth } from '@/lib/contexts/AuthContext';
import { NotifiedMutationError } from '@/lib/notifiedMutationError';
import { createModulePaginatedListQuery } from '@/lib/query/createModulePaginatedListQuery';
import {
  buildExaminationsPageUrl,
  examinationsPaginatedQueryKey,
  examinationsListQueryKeyParams,
  sameExaminationsListFilters,
  type ExaminationsPaginatedParams,
  type ExaminationsListPageResult,
} from '@/tenant/features/examinations/hooks/examinationsListQueryBuilders';

export const EXAMINATIONS_EXAMS_QUERY_KEY = ['examinations', 'exams', 'list'] as const;
export const EXAMINATIONS_RESULTS_QUERY_KEY = ['examinations', 'results', 'list'] as const;
export const EXAMINATIONS_METRICS_QUERY_KEY = ['examinations', 'metrics'] as const;

export const EXAMINATIONS_API = EXAMINATIONS_MODULE_MANIFEST.restBasePath;

/** @deprecated Prefer NotifiedMutationError — kept for form catch compatibility. */
export class NotifiedExaminationsMutationError extends NotifiedMutationError {}

export function useExaminationsExams(options?: { enabled?: boolean; includeDeleted?: boolean }) {
  const { isAuthenticated } = useAuth();
  const includeDeleted = options?.includeDeleted ?? false;
  return useQuery<Exam[]>({
    queryKey: [...EXAMINATIONS_EXAMS_QUERY_KEY, { includeDeleted }],
    queryFn: async ({ signal }) => {
      const res = await apiJson<{ exams: Exam[] }>(
        `${EXAMINATIONS_API}/exams?includeDeleted=${includeDeleted}`,
        { signal },
      );
      return res?.exams ?? [];
    },
    enabled: isAuthenticated && (options?.enabled ?? true),
    staleTime: 30_000,
  });
}

export function useExaminationsExamsCollection(options?: {
  enabled?: boolean;
  includeDeleted?: boolean;
}): Exam[] {
  return useExaminationsExams(options).data ?? [];
}

/** SQL-paged exams Work list (server-side search/status/soft-delete). */
export const useExaminationsPaginated = createModulePaginatedListQuery<
  ExaminationsListPageResult,
  ExaminationsPaginatedParams,
  ReturnType<typeof examinationsListQueryKeyParams>
>({
  queryKey: examinationsPaginatedQueryKey,
  keyParams: examinationsListQueryKeyParams,
  sameFilters: sameExaminationsListFilters,
  buildUrl: buildExaminationsPageUrl,
});

export function useExaminationsResults(options?: { enabled?: boolean }) {
  const { isAuthenticated } = useAuth();
  return useQuery<ExamResult[]>({
    queryKey: EXAMINATIONS_RESULTS_QUERY_KEY,
    queryFn: async ({ signal }) => {
      const res = await apiJson<{ results: ExamResult[] }>(
        `${EXAMINATIONS_API}/results`,
        { signal },
      );
      return res?.results ?? [];
    },
    enabled: isAuthenticated && (options?.enabled ?? true),
    staleTime: 30_000,
  });
}

export function useExaminationsResultsCollection(options?: { enabled?: boolean }): ExamResult[] {
  return useExaminationsResults(options).data ?? [];
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
    onSuccess: () => {
      invalidateExams();
    },
  });

  const replaceExamResults = useMutation({
    mutationFn: async (results: ExamResult[]) =>
      apiJson<{ results: ExamResult[] }>(`${EXAMINATIONS_API}/results/bulk`, {
        method: 'PUT',
        body: JSON.stringify(results),
      }),
    onSuccess: () => {
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
