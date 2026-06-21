import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { HasanatCommandMetricsSnapshot, ModuleColumnPref } from '@mms/shared';
import { HASANAT_MODULE_CONTRACT } from '@mms/shared';
import { useAuth } from '@/lib/contexts/AuthContext';
import { apiJson } from '@/lib/apiClient';

const HASANAT_API = HASANAT_MODULE_CONTRACT.restBasePath;

export const HASANAT_METRICS_QUERY_KEY = [HASANAT_MODULE_CONTRACT.moduleId, 'metrics'] as const;

export const HASANAT_DISTRIBUTION_COLUMN_PREFS_QUERY_KEY = [
  HASANAT_MODULE_CONTRACT.moduleId,
  'distributions',
  'column-prefs',
] as const;

export const HASANAT_REDEMPTION_COLUMN_PREFS_QUERY_KEY = [
  HASANAT_MODULE_CONTRACT.moduleId,
  'redemptions',
  'column-prefs',
] as const;

export function useHasanatMetrics() {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: HASANAT_METRICS_QUERY_KEY,
    queryFn: async () => {
      const body = await apiJson<{ metrics: HasanatCommandMetricsSnapshot }>(`${HASANAT_API}/metrics`);
      return body.metrics;
    },
    enabled: isAuthenticated,
    staleTime: 30_000,
  });
}

export function useHasanatDistributionColumnPrefs() {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: HASANAT_DISTRIBUTION_COLUMN_PREFS_QUERY_KEY,
    queryFn: async () => {
      const body = await apiJson<{ prefs: ModuleColumnPref[] }>(`${HASANAT_API}/distributions/column-prefs`);
      return body.prefs;
    },
    enabled: isAuthenticated,
    staleTime: 60_000,
  });
}

export function useHasanatDistributionColumnPrefsMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (prefs: ModuleColumnPref[]) =>
      apiJson<{ success: boolean; prefs: ModuleColumnPref[] }>(`${HASANAT_API}/distributions/column-prefs`, {
        method: 'PUT',
        body: JSON.stringify({ prefs }),
      }),
    onSuccess: (data) => {
      queryClient.setQueryData(HASANAT_DISTRIBUTION_COLUMN_PREFS_QUERY_KEY, data.prefs);
    },
  });
}

export function useHasanatRedemptionColumnPrefs() {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: HASANAT_REDEMPTION_COLUMN_PREFS_QUERY_KEY,
    queryFn: async () => {
      const body = await apiJson<{ prefs: ModuleColumnPref[] }>(`${HASANAT_API}/redemptions/column-prefs`);
      return body.prefs;
    },
    enabled: isAuthenticated,
    staleTime: 60_000,
  });
}

export function useHasanatRedemptionColumnPrefsMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (prefs: ModuleColumnPref[]) =>
      apiJson<{ success: boolean; prefs: ModuleColumnPref[] }>(`${HASANAT_API}/redemptions/column-prefs`, {
        method: 'PUT',
        body: JSON.stringify({ prefs }),
      }),
    onSuccess: (data) => {
      queryClient.setQueryData(HASANAT_REDEMPTION_COLUMN_PREFS_QUERY_KEY, data.prefs);
    },
  });
}
