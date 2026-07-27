import type { FinanceCommandMetricsSnapshot } from '@mms/shared';
import { FINANCE_MODULE_MANIFEST } from '@mms/shared';
import { useServerMetrics } from '@/hooks/useServerMetrics';

export const FINANCE_METRICS_QUERY_KEY = [FINANCE_MODULE_MANIFEST.moduleId, 'metrics'] as const;

export function useFinanceMetrics(options?: { enabled?: boolean }) {
  return useServerMetrics<FinanceCommandMetricsSnapshot>({
    moduleId: FINANCE_MODULE_MANIFEST.moduleId,
    apiPath: FINANCE_MODULE_MANIFEST.restBasePath,
    enabled: options?.enabled,
  });
}
