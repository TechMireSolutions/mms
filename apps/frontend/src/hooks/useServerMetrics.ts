import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/lib/contexts/AuthContext';
import { apiJson } from '@/lib/apiClient';

export interface UseServerMetricsOptions {
  moduleId: string;
  apiPath: string;
  extraParam?: string;
  enabled?: boolean;
}

export function useServerMetrics<T>({
  moduleId,
  apiPath,
  extraParam,
  enabled = true,
}: UseServerMetricsOptions) {
  const { isAuthenticated } = useAuth();

  const queryKey = (() => {
    return extraParam
      ? [moduleId, 'metrics', extraParam] as const
      : [moduleId, 'metrics'] as const;
  })();

  return useQuery({
    queryKey,
    queryFn: async ({ signal }) => {
      const queryString = extraParam ? `?date=${encodeURIComponent(extraParam)}` : '';
      const response = await apiJson<{ metrics: T }>(`${apiPath}/metrics${queryString}`, {
        signal,
      });
      return response?.metrics ?? ({} as T);
    },
    enabled: isAuthenticated && enabled,
    staleTime: 30_000,
  });
}
