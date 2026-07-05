import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Invoice, Payment } from '@mms/shared';
import { FINANCE_MODULE_CONTRACT } from '@mms/shared';
import { useAuth } from '@/lib/contexts/AuthContext';
import { apiFetch, apiJson } from '@/lib/apiClient';
import { saveCollection } from '@/lib/db';
import { useLiveCollection } from '@/hooks/useLiveCollection';

export const FINANCE_INVOICES_QUERY_KEY = ['finance', 'invoices', 'list'] as const;
export const FINANCE_PAYMENTS_QUERY_KEY = ['finance', 'payments', 'list'] as const;
export const FINANCE_METRICS_QUERY_KEY = ['finance', 'metrics'] as const;

const FINANCE_API = FINANCE_MODULE_CONTRACT.restBasePath;

async function fetchInvoices(): Promise<Invoice[]> {
  const invoicesResponse = await apiJson<{ invoices: Invoice[] }>(`${FINANCE_API}/invoices`);
  saveCollection('finance_invoices', invoicesResponse.invoices);
  return invoicesResponse.invoices;
}

async function fetchPayments(): Promise<Payment[]> {
  const paymentsResponse = await apiJson<{ payments: Payment[] }>(`${FINANCE_API}/payments`);
  saveCollection('finance_payments', paymentsResponse.payments);
  return paymentsResponse.payments;
}

export function useFinanceInvoices(options?: { enabled?: boolean }) {
  const queryEnabled = options?.enabled ?? true;
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: FINANCE_INVOICES_QUERY_KEY,
    queryFn: fetchInvoices,
    enabled: isAuthenticated && queryEnabled,
    staleTime: 30_000,
  });
}

export function useFinancePayments(options?: { enabled?: boolean }) {
  const queryEnabled = options?.enabled ?? true;
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: FINANCE_PAYMENTS_QUERY_KEY,
    queryFn: fetchPayments,
    enabled: isAuthenticated && queryEnabled,
    staleTime: 30_000,
  });
}

export function useFinanceInvoicesCollection(options?: { enabled?: boolean }): Invoice[] {
  const enabled = options?.enabled ?? true;
  const { data: queryInvoices, isSuccess } = useFinanceInvoices({ enabled });
  const localInvoices = useLiveCollection<Invoice>('finance_invoices', [], { enabled });
  if (!enabled) return [];
  if (isSuccess && queryInvoices) {
    return queryInvoices;
  }
  return localInvoices;
}

export function useFinancePaymentsCollection(options?: { enabled?: boolean }): Payment[] {
  const enabled = options?.enabled ?? true;
  const { data: queryPayments, isSuccess } = useFinancePayments({ enabled });
  const localPayments = useLiveCollection<Payment>('finance_payments', [], { enabled });
  if (!enabled) return [];
  if (isSuccess && queryPayments) {
    return queryPayments;
  }
  return localPayments;
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
