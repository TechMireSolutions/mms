import { useState, type Dispatch, type SetStateAction } from 'react';
import { apiJson } from '@/lib/apiClient';
import type { LlmConfig, LlmTestResult } from '@mms/shared';
import type { LlmHealthStatus } from './llmSettingsControllerTypes';

interface UseLlmConfigListActionsOptions {
  configs: LlmConfig[];
  upd: (key: 'llmConfigs', value: LlmConfig[]) => void;
  setHealthStatuses: Dispatch<SetStateAction<Record<string, LlmHealthStatus>>>;
}

export function useLlmConfigListActions({
  configs,
  upd,
  setHealthStatuses,
}: UseLlmConfigListActionsOptions) {
  const [testingId, setTestingId] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<LlmTestResult | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const handleDeleteConfig = (configId: string) => {
    const updatedConfigs = configs.filter((config) => config.id !== configId);

    if (configs.find((config) => config.id === configId)?.isDefaultText && updatedConfigs.length > 0) {
      updatedConfigs[0] = { ...updatedConfigs[0], isDefaultText: true };
    }

    upd('llmConfigs', updatedConfigs);
    if (testResult?.configId === configId) {
      setTestResult(null);
    }
  };

  const handleTestConnection = async (configId: string) => {
    setTestingId(configId);
    setTestResult(null);

    try {
      setHealthStatuses((prev) => ({ ...prev, [configId]: 'testing' }));

      const res = await apiJson<LlmTestResult>('/api/ai/test', {
        method: 'POST',
        body: JSON.stringify({ prompt: 'Write a short greeting for a school portal.', configId }),
      });
      setTestResult({
        configId,
        success: res.success,
        response: res.response,
        message: res.message,
        metrics: res.metrics,
      });
      setHealthStatuses((prev) => ({ ...prev, [configId]: res.success ? 'verified' : 'failed' }));
    } catch (err: unknown) {
      setTestResult({
        configId,
        success: false,
        message: err instanceof Error ? err.message : 'Test request failed',
      });
      setHealthStatuses((prev) => ({ ...prev, [configId]: 'failed' }));
    } finally {
      setTestingId(null);
    }
  };

  return {
    searchQuery,
    setSearchQuery,
    testingId,
    testResult,
    handleDeleteConfig,
    handleTestConnection,
  };
}
