import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { Invoice, Payment } from '@mms/shared';
import { FINANCE_MODULE_CONTRACT } from '@mms/shared';
import { apiFetch, apiJson } from '@/lib/apiClient';
import { useCollectionSync } from '@/hooks/useCollectionSync';

export const FINANCE_INVOICES_QUERY_KEY = ['finance', 'invoices', 'list'] as const;
export const FINANCE_PAYMENTS_QUERY_KEY = ['finance', 'payments', 'list'] as const;
export const FINANCE_METRICS_QUERY_KEY = ['finance', 'metrics'] as const;

const FINANCE_API = FINANCE_MODULE_CONTRACT.restBasePath;

export function useFinanceInvoices(options?: { enabled?: boolean }) {
  return useCollectionSync<Invoice>({
    queryKey: FINANCE_INVOICES_QUERY_KEY,
    apiPath: `${FINANCE_API}/invoices`,
    responseKey: 'invoices',
    collectionName: 'finance_invoices',
    enabled: options?.enabled,
  });
}

export function useFinancePayments(options?: { enabled?: boolean }) {
  return useCollectionSync<Payment>({
    queryKey: FINANCE_PAYMENTS_QUERY_KEY,
    apiPath: `${FINANCE_API}/payments`,
    responseKey: 'payments',
    collectionName: 'finance_payments',
    enabled: options?.enabled,
  });
}

export function useFinanceInvoicesCollection(options?: { enabled?: boolean }): Invoice[] {
  return useFinanceInvoices(options).syncedData;
}

export function useFinancePaymentsCollection(options?: { enabled?: boolean }): Payment[] {
  return useFinancePayments(options).syncedData;
}

export function useFinanceMutations() {
  const queryClient = useQueryClient();

  const invalidateAll = () => {
    void queryClient.invalidateQueries({ queryKey: FINANCE_INVOICES_QUERY_KEY });
    void queryClient.invalidateQueries({ queryKey: FINANCE_PAYMENTS_QUERY_KEY });
    void queryClient.invalidateQueries({ queryKey: FINANCE_METRICS_QUERY_KEY });
  };

  const createInvoice = useMutation({
    mutationFn: async (invoice: Invoice) =>
      apiJson<{ invoice: Invoice }>(`${FINANCE_API}/invoices`, {
        method: 'POST',
        body: JSON.stringify(invoice),
      }),
    onSuccess: invalidateAll,
  });

  const updateInvoice = useMutation({
    mutationFn: async ({ id, invoice }: { id: string; invoice: Invoice }) =>
      apiJson<{ invoice: Invoice }>(`${FINANCE_API}/invoices/${id}`, {
        method: 'PUT',
        body: JSON.stringify(invoice),
      }),
    onSuccess: invalidateAll,
  });

  const deleteInvoice = useMutation({
    mutationFn: async (id: string) =>
      apiFetch(`${FINANCE_API}/invoices/${id}`, { method: 'DELETE' }),
    onSuccess: invalidateAll,
  });

  const createPayment = useMutation({
    mutationFn: async (payment: Payment) =>
      apiJson<{ payment: Payment }>(`${FINANCE_API}/payments`, {
        method: 'POST',
        body: JSON.stringify(payment),
      }),
    onSuccess: invalidateAll,
  });

  const updatePayment = useMutation({
    mutationFn: async ({ id, payment }: { id: string; payment: Payment }) =>
      apiJson<{ payment: Payment }>(`${FINANCE_API}/payments/${id}`, {
        method: 'PUT',
        body: JSON.stringify(payment),
      }),
    onSuccess: invalidateAll,
  });

  const deletePayment = useMutation({
    mutationFn: async (id: string) =>
      apiFetch(`${FINANCE_API}/payments/${id}`, { method: 'DELETE' }),
    onSuccess: invalidateAll,
  });

  return {
    createInvoice,
    updateInvoice,
    deleteInvoice,
    createPayment,
    updatePayment,
    deletePayment,
  };
}
