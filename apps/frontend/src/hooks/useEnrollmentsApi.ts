import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { EnrollmentsCommandMetricsSnapshot, ModuleColumnPref } from '@mms/shared';
import { ENROLLMENTS_MODULE_CONTRACT } from '@mms/shared';
import { useAuth } from '@/lib/contexts/AuthContext';
import { apiJson } from '@/lib/apiClient';

const ENROLLMENTS_API = ENROLLMENTS_MODULE_CONTRACT.restBasePath;

export const ENROLLMENTS_METRICS_QUERY_KEY = ['enrollments', 'metrics'] as const;
export const ENROLLMENT_COLUMN_PREFS_QUERY_KEY = [
  ENROLLMENTS_MODULE_CONTRACT.collectionKey,
  'column-prefs',
] as const;

export function useEnrollmentsMetrics() {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: ENROLLMENTS_METRICS_QUERY_KEY,
    queryFn: async () => {
      const body = await apiJson<{ metrics: EnrollmentsCommandMetricsSnapshot }>(`${ENROLLMENTS_API}/metrics`);
      return body.metrics;
    },
    enabled: isAuthenticated,
    staleTime: 30_000,
  });
}

export function useEnrollmentColumnPrefs() {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: ENROLLMENT_COLUMN_PREFS_QUERY_KEY,
    queryFn: async () => {
      const body = await apiJson<{ prefs: ModuleColumnPref[] }>(`${ENROLLMENTS_API}/column-prefs`);
      return body.prefs;
    },
    enabled: isAuthenticated,
    staleTime: 60_000,
  });
}

export function useEnrollmentColumnPrefsMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (prefs: ModuleColumnPref[]) =>
      apiJson<{ success: boolean; prefs: ModuleColumnPref[] }>(`${ENROLLMENTS_API}/column-prefs`, {
        method: 'PUT',
        body: JSON.stringify({ prefs }),
      }),
    onSuccess: (data) => {
      queryClient.setQueryData(ENROLLMENT_COLUMN_PREFS_QUERY_KEY, data.prefs);
    },
  });
}
