import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ModuleColumnPreference, FinanceCommandMetricsSnapshot } from '@mms/shared';
import { FINANCE_MODULE_CONTRACT } from '@mms/shared';
import { useAuth } from '@/lib/contexts/AuthContext';
import { apiJson } from '@/lib/apiClient';

const FINANCE_API = FINANCE_MODULE_CONTRACT.restBasePath;

export const FINANCE_METRICS_QUERY_KEY = [FINANCE_MODULE_CONTRACT.moduleId, 'metrics'] as const;

export const FINANCE_INVOICE_COLUMN_PREFERENCES_QUERY_KEY = [
  FINANCE_MODULE_CONTRACT.moduleId,
  'invoices',
  'column-preferences',
] as const;

export const FINANCE_PAYMENT_COLUMN_PREFERENCES_QUERY_KEY = [
  FINANCE_MODULE_CONTRACT.moduleId,
  'payments',
  'column-preferences',
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

export function useFinanceInvoiceColumnPreferences() {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: FINANCE_INVOICE_COLUMN_PREFERENCES_QUERY_KEY,
    queryFn: async () => {
      const body = await apiJson<{ preferences: ModuleColumnPreference[] }>(`${FINANCE_API}/invoices/column-preferences`);
      return body.preferences;
    },
    enabled: isAuthenticated,
    staleTime: 60_000,
  });
}

export function useFinanceInvoiceColumnPreferencesMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (preferences: ModuleColumnPreference[]) =>
      apiJson<{ success: boolean; preferences: ModuleColumnPreference[] }>(`${FINANCE_API}/invoices/column-preferences`, {
        method: 'PUT',
        body: JSON.stringify({ preferences }),
      }),
    onSuccess: (data) => {
      queryClient.setQueryData(FINANCE_INVOICE_COLUMN_PREFERENCES_QUERY_KEY, data.preferences);
    },
  });
}

export function useFinancePaymentColumnPreferences() {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: FINANCE_PAYMENT_COLUMN_PREFERENCES_QUERY_KEY,
    queryFn: async () => {
      const body = await apiJson<{ preferences: ModuleColumnPreference[] }>(`${FINANCE_API}/payments/column-preferences`);
      return body.preferences;
    },
    enabled: isAuthenticated,
    staleTime: 60_000,
  });
}

export function useFinancePaymentColumnPreferencesMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (preferences: ModuleColumnPreference[]) =>
      apiJson<{ success: boolean; preferences: ModuleColumnPreference[] }>(`${FINANCE_API}/payments/column-preferences`, {
        method: 'PUT',
        body: JSON.stringify({ preferences }),
      }),
    onSuccess: (data) => {
      queryClient.setQueryData(FINANCE_PAYMENT_COLUMN_PREFERENCES_QUERY_KEY, data.preferences);
    },
  });
}
