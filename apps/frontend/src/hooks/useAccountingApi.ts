import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { AccountingCommandMetricsSnapshot, ModuleColumnPref } from '@mms/shared';
import { ACCOUNTING_MODULE_CONTRACT } from '@mms/shared';
import { useAuth } from '@/lib/contexts/AuthContext';
import { apiJson } from '@/lib/apiClient';

const ACCOUNTING_API = ACCOUNTING_MODULE_CONTRACT.restBasePath;

export const ACCOUNTING_METRICS_QUERY_KEY = [ACCOUNTING_MODULE_CONTRACT.moduleId, 'metrics'] as const;

export const ACCOUNTING_JOURNAL_COLUMN_PREFS_QUERY_KEY = [
  ACCOUNTING_MODULE_CONTRACT.moduleId,
  'journal',
  'column-prefs',
] as const;

export const ACCOUNTING_ACCOUNT_COLUMN_PREFS_QUERY_KEY = [
  ACCOUNTING_MODULE_CONTRACT.moduleId,
  'accounts',
  'column-prefs',
] as const;

export function useAccountingMetrics() {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: ACCOUNTING_METRICS_QUERY_KEY,
    queryFn: async () => {
      const body = await apiJson<{ metrics: AccountingCommandMetricsSnapshot }>(`${ACCOUNTING_API}/metrics`);
      return body.metrics;
    },
    enabled: isAuthenticated,
    staleTime: 30_000,
  });
}

export function useAccountingJournalColumnPrefs() {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: ACCOUNTING_JOURNAL_COLUMN_PREFS_QUERY_KEY,
    queryFn: async () => {
      const body = await apiJson<{ prefs: ModuleColumnPref[] }>(`${ACCOUNTING_API}/journal/column-prefs`);
      return body.prefs;
    },
    enabled: isAuthenticated,
    staleTime: 60_000,
  });
}

export function useAccountingJournalColumnPrefsMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (prefs: ModuleColumnPref[]) =>
      apiJson<{ success: boolean; prefs: ModuleColumnPref[] }>(`${ACCOUNTING_API}/journal/column-prefs`, {
        method: 'PUT',
        body: JSON.stringify({ prefs }),
      }),
    onSuccess: (data) => {
      queryClient.setQueryData(ACCOUNTING_JOURNAL_COLUMN_PREFS_QUERY_KEY, data.prefs);
    },
  });
}

export function useAccountingAccountColumnPrefs() {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: ACCOUNTING_ACCOUNT_COLUMN_PREFS_QUERY_KEY,
    queryFn: async () => {
      const body = await apiJson<{ prefs: ModuleColumnPref[] }>(`${ACCOUNTING_API}/accounts/column-prefs`);
      return body.prefs;
    },
    enabled: isAuthenticated,
    staleTime: 60_000,
  });
}

export function useAccountingAccountColumnPrefsMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (prefs: ModuleColumnPref[]) =>
      apiJson<{ success: boolean; prefs: ModuleColumnPref[] }>(`${ACCOUNTING_API}/accounts/column-prefs`, {
        method: 'PUT',
        body: JSON.stringify({ prefs }),
      }),
    onSuccess: (data) => {
      queryClient.setQueryData(ACCOUNTING_ACCOUNT_COLUMN_PREFS_QUERY_KEY, data.prefs);
    },
  });
}
