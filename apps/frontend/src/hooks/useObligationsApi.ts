import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ModuleColumnPref, ObligationsCommandMetricsSnapshot } from '@mms/shared';
import { OBLIGATIONS_MODULE_CONTRACT } from '@mms/shared';
import { useAuth } from '@/lib/contexts/AuthContext';
import { apiJson } from '@/lib/apiClient';

const OBLIGATIONS_API = OBLIGATIONS_MODULE_CONTRACT.restBasePath;

export const OBLIGATIONS_METRICS_QUERY_KEY = ['obligations', 'metrics'] as const;
export const OBLIGATION_COLUMN_PREFS_QUERY_KEY = [
  OBLIGATIONS_MODULE_CONTRACT.collectionKey,
  'column-prefs',
] as const;

export function useObligationsMetrics() {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: OBLIGATIONS_METRICS_QUERY_KEY,
    queryFn: async () => {
      const body = await apiJson<{ metrics: ObligationsCommandMetricsSnapshot }>(`${OBLIGATIONS_API}/metrics`);
      return body.metrics;
    },
    enabled: isAuthenticated,
    staleTime: 30_000,
  });
}

export function useObligationColumnPrefs() {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: OBLIGATION_COLUMN_PREFS_QUERY_KEY,
    queryFn: async () => {
      const body = await apiJson<{ prefs: ModuleColumnPref[] }>(`${OBLIGATIONS_API}/column-prefs`);
      return body.prefs;
    },
    enabled: isAuthenticated,
    staleTime: 60_000,
  });
}

export function useObligationColumnPrefsMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (prefs: ModuleColumnPref[]) =>
      apiJson<{ success: boolean; prefs: ModuleColumnPref[] }>(`${OBLIGATIONS_API}/column-prefs`, {
        method: 'PUT',
        body: JSON.stringify({ prefs }),
      }),
    onSuccess: (data) => {
      queryClient.setQueryData(OBLIGATION_COLUMN_PREFS_QUERY_KEY, data.prefs);
    },
  });
}
