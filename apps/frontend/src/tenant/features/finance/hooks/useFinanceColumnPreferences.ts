import { useQuery } from '@tanstack/react-query';
import type { FinanceCommandMetricsSnapshot } from '@mms/shared';
import { FINANCE_MODULE_CONTRACT } from '@mms/shared';
import { useAuth } from '@/lib/contexts/AuthContext';
import { apiJson } from '@/lib/apiClient';

const FINANCE_API = FINANCE_MODULE_CONTRACT.restBasePath;

export const FINANCE_METRICS_QUERY_KEY = [FINANCE_MODULE_CONTRACT.moduleId, 'metrics'] as const;

export function useFinanceMetrics() {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: FINANCE_METRICS_QUERY_KEY,
    queryFn: async () => {
      const metricsResponse = await apiJson<{ metrics: FinanceCommandMetricsSnapshot }>(`${FINANCE_API}/metrics`);
      return metricsResponse.metrics;
    },
    enabled: isAuthenticated,
    staleTime: 30_000,
  });
}
