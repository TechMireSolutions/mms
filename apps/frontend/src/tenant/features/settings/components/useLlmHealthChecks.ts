import { useCallback, useEffect, useState } from 'react';
import { apiJson } from '@/lib/apiClient';
import type { LlmConfig } from '@mms/shared';
import type { LlmHealthStatus } from './llmSettingsControllerTypes';

export function useLlmHealthChecks(configs: LlmConfig[]) {
  const [healthStatuses, setHealthStatuses] = useState<Record<string, LlmHealthStatus>>({});

  const runHealthCheck = useCallback(async (configId: string) => {
    setHealthStatuses((prev) => ({ ...prev, [configId]: 'testing' }));
    try {
      const res = await apiJson<{ success: boolean }>('/api/ai/test', {
        method: 'POST',
        body: JSON.stringify({
          prompt: 'Respond only with the word: ok',
          configId,
        }),
      });
      setHealthStatuses((prev) => ({ ...prev, [configId]: res.success ? 'verified' : 'failed' }));
    } catch {
      setHealthStatuses((prev) => ({ ...prev, [configId]: 'failed' }));
    }
  }, []);

  useEffect(() => {
    configs.forEach((config) => {
      if (!healthStatuses[config.id]) {
        void runHealthCheck(config.id);
      }
    });
  }, [configs, healthStatuses, runHealthCheck]);

  return { healthStatuses, setHealthStatuses };
}
