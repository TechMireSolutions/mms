import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ExaminationsCommandMetricsSnapshot, ModuleColumnPref } from '@mms/shared';
import { EXAMINATIONS_MODULE_CONTRACT } from '@mms/shared';
import { useAuth } from '@/lib/contexts/AuthContext';
import { apiJson } from '@/lib/apiClient';

const EXAMINATIONS_API = EXAMINATIONS_MODULE_CONTRACT.restBasePath;

export const EXAMINATIONS_METRICS_QUERY_KEY = [EXAMINATIONS_MODULE_CONTRACT.moduleId, 'metrics'] as const;

export const EXAMINATIONS_EXAM_COLUMN_PREFS_QUERY_KEY = [
  EXAMINATIONS_MODULE_CONTRACT.moduleId,
  'exams',
  'column-prefs',
] as const;

export const EXAMINATIONS_RESULTS_COLUMN_PREFS_QUERY_KEY = [
  EXAMINATIONS_MODULE_CONTRACT.moduleId,
  'results',
  'column-prefs',
] as const;

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

export function useExaminationExamColumnPrefs() {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: EXAMINATIONS_EXAM_COLUMN_PREFS_QUERY_KEY,
    queryFn: async () => {
      const body = await apiJson<{ prefs: ModuleColumnPref[] }>(`${EXAMINATIONS_API}/exams/column-prefs`);
      return body.prefs;
    },
    enabled: isAuthenticated,
    staleTime: 60_000,
  });
}

export function useExaminationExamColumnPrefsMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (prefs: ModuleColumnPref[]) =>
      apiJson<{ success: boolean; prefs: ModuleColumnPref[] }>(`${EXAMINATIONS_API}/exams/column-prefs`, {
        method: 'PUT',
        body: JSON.stringify({ prefs }),
      }),
    onSuccess: (data) => {
      queryClient.setQueryData(EXAMINATIONS_EXAM_COLUMN_PREFS_QUERY_KEY, data.prefs);
    },
  });
}

export function useExaminationResultsColumnPrefs() {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: EXAMINATIONS_RESULTS_COLUMN_PREFS_QUERY_KEY,
    queryFn: async () => {
      const body = await apiJson<{ prefs: ModuleColumnPref[] }>(`${EXAMINATIONS_API}/results/column-prefs`);
      return body.prefs;
    },
    enabled: isAuthenticated,
    staleTime: 60_000,
  });
}

export function useExaminationResultsColumnPrefsMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (prefs: ModuleColumnPref[]) =>
      apiJson<{ success: boolean; prefs: ModuleColumnPref[] }>(`${EXAMINATIONS_API}/results/column-prefs`, {
        method: 'PUT',
        body: JSON.stringify({ prefs }),
      }),
    onSuccess: (data) => {
      queryClient.setQueryData(EXAMINATIONS_RESULTS_COLUMN_PREFS_QUERY_KEY, data.prefs);
    },
  });
}
