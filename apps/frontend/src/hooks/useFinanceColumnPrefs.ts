import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ModuleColumnPref, FinanceCommandMetricsSnapshot } from '@mms/shared';
import { FINANCE_MODULE_CONTRACT } from '@mms/shared';
import { useAuth } from '@/lib/contexts/AuthContext';
import { apiJson } from '@/lib/apiClient';

const FINANCE_API = FINANCE_MODULE_CONTRACT.restBasePath;

export const FINANCE_METRICS_QUERY_KEY = [FINANCE_MODULE_CONTRACT.moduleId, 'metrics'] as const;

export const FINANCE_INVOICE_COLUMN_PREFS_QUERY_KEY = [
  FINANCE_MODULE_CONTRACT.moduleId,
  'invoices',
  'column-prefs',
] as const;

export const FINANCE_PAYMENT_COLUMN_PREFS_QUERY_KEY = [
  FINANCE_MODULE_CONTRACT.moduleId,
  'payments',
  'column-prefs',
] as const;

export function useFinanceMetrics() {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: FINANCE_METRICS_QUERY_KEY,
    queryFn: async () => {
      const body = await apiJson<{ metrics: FinanceCommandMetricsSnapshot }>(`${FINANCE_API}/metrics`);
      return body.metrics;
    },
    enabled: isAuthenticated,
    staleTime: 30_000,
  });
}

export function useFinanceInvoiceColumnPrefs() {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: FINANCE_INVOICE_COLUMN_PREFS_QUERY_KEY,
    queryFn: async () => {
      const body = await apiJson<{ prefs: ModuleColumnPref[] }>(`${FINANCE_API}/invoices/column-prefs`);
      return body.prefs;
    },
    enabled: isAuthenticated,
    staleTime: 60_000,
  });
}

export function useFinanceInvoiceColumnPrefsMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (prefs: ModuleColumnPref[]) =>
      apiJson<{ success: boolean; prefs: ModuleColumnPref[] }>(`${FINANCE_API}/invoices/column-prefs`, {
        method: 'PUT',
        body: JSON.stringify({ prefs }),
      }),
    onSuccess: (data) => {
      queryClient.setQueryData(FINANCE_INVOICE_COLUMN_PREFS_QUERY_KEY, data.prefs);
    },
  });
}

export function useFinancePaymentColumnPrefs() {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: FINANCE_PAYMENT_COLUMN_PREFS_QUERY_KEY,
    queryFn: async () => {
      const body = await apiJson<{ prefs: ModuleColumnPref[] }>(`${FINANCE_API}/payments/column-prefs`);
      return body.prefs;
    },
    enabled: isAuthenticated,
    staleTime: 60_000,
  });
}

export function useFinancePaymentColumnPrefsMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (prefs: ModuleColumnPref[]) =>
      apiJson<{ success: boolean; prefs: ModuleColumnPref[] }>(`${FINANCE_API}/payments/column-prefs`, {
        method: 'PUT',
        body: JSON.stringify({ prefs }),
      }),
    onSuccess: (data) => {
      queryClient.setQueryData(FINANCE_PAYMENT_COLUMN_PREFS_QUERY_KEY, data.prefs);
    },
  });
}
