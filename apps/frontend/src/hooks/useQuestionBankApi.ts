import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ModuleColumnPref, QuestionBankCommandMetricsSnapshot } from '@mms/shared';
import { QUESTION_BANK_MODULE_CONTRACT } from '@mms/shared';
import { useAuth } from '@/lib/contexts/AuthContext';
import { apiJson } from '@/lib/apiClient';

const QUESTION_BANK_API = QUESTION_BANK_MODULE_CONTRACT.restBasePath;

export const QUESTION_BANK_METRICS_QUERY_KEY = [QUESTION_BANK_MODULE_CONTRACT.moduleId, 'metrics'] as const;

export const QUESTION_BANK_COLUMN_PREFS_QUERY_KEY = [
  QUESTION_BANK_MODULE_CONTRACT.moduleId,
  'column-prefs',
] as const;

export function useQuestionBankMetrics() {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: QUESTION_BANK_METRICS_QUERY_KEY,
    queryFn: async () => {
      const body = await apiJson<{ metrics: QuestionBankCommandMetricsSnapshot }>(`${QUESTION_BANK_API}/metrics`);
      return body.metrics;
    },
    enabled: isAuthenticated,
    staleTime: 30_000,
  });
}

export function useQuestionBankColumnPrefs() {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: QUESTION_BANK_COLUMN_PREFS_QUERY_KEY,
    queryFn: async () => {
      const body = await apiJson<{ prefs: ModuleColumnPref[] }>(`${QUESTION_BANK_API}/column-prefs`);
      return body.prefs;
    },
    enabled: isAuthenticated,
    staleTime: 60_000,
  });
}

export function useQuestionBankColumnPrefsMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (prefs: ModuleColumnPref[]) =>
      apiJson<{ success: boolean; prefs: ModuleColumnPref[] }>(`${QUESTION_BANK_API}/column-prefs`, {
        method: 'PUT',
        body: JSON.stringify({ prefs }),
      }),
    onSuccess: (data) => {
      queryClient.setQueryData(QUESTION_BANK_COLUMN_PREFS_QUERY_KEY, data.prefs);
    },
  });
}
