import { useMutation, useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import type {
  FinanceReportAggregates,
  FinanceReportComparisonQuery,
  FinanceListQuery,
  FinanceInvoicesListPageResult,
  FinancePaymentsListPageResult,
  Invoice,
  InvoiceCreateInput,
  InvoicesBulkStatusBody,
  Payment,
  PaymentCreateInput,
} from '@mms/shared';
import { FINANCE_MODULE_MANIFEST, normalizeFinanceReportComparisonQuery } from '@mms/shared';
import { apiFetch, apiJson } from '@/lib/apiClient';
import { NotifiedMutationError } from '@/lib/notifiedMutationError';
import { useAuth } from '@/lib/contexts/AuthContext';

export const FINANCE_INVOICES_QUERY_KEY = ['finance', 'invoices', 'list'] as const;
export const FINANCE_PAYMENTS_QUERY_KEY = ['finance', 'payments', 'list'] as const;
export const FINANCE_METRICS_QUERY_KEY = ['finance', 'metrics'] as const;
export const FINANCE_REPORT_AGGREGATES_QUERY_KEY = [
  FINANCE_MODULE_MANIFEST.collectionKey,
  'report-aggregates',
] as const;

const FINANCE_API = FINANCE_MODULE_MANIFEST.restBasePath;

/** @deprecated Prefer NotifiedMutationError — kept for form catch compatibility. */
export class NotifiedFinanceMutationError extends NotifiedMutationError {}

export function useFinanceInvoicesPaginated(query: FinanceListQuery, options?: { enabled?: boolean }) {
  const { isAuthenticated } = useAuth();
  const enabled = (options?.enabled ?? true) && isAuthenticated;
  
  const queryParams = new URLSearchParams();
  if (query.page) queryParams.set('page', String(query.page));
  if (query.limit) queryParams.set('limit', String(query.limit));
  if (query.search) queryParams.set('search', query.search);
  if (query.sortField) queryParams.set('sortField', query.sortField);
  if (query.sortDir) queryParams.set('sortDir', query.sortDir);
  if (query.includeDeleted) queryParams.set('includeDeleted', 'true');
  
  const queryString = queryParams.toString();

  return useQuery({
    queryKey: [...FINANCE_INVOICES_QUERY_KEY, query],
    queryFn: async ({ signal }): Promise<FinanceInvoicesListPageResult> =>
      apiJson<FinanceInvoicesListPageResult>(
        `${FINANCE_API}/invoices${queryString ? `?${queryString}` : ''}`,
        { signal },
      ),
    enabled,
    placeholderData: keepPreviousData,
  });
}

export function useFinancePaymentsPaginated(query: FinanceListQuery, options?: { enabled?: boolean }) {
  const { isAuthenticated } = useAuth();
  const enabled = (options?.enabled ?? true) && isAuthenticated;
  
  const queryParams = new URLSearchParams();
  if (query.page) queryParams.set('page', String(query.page));
  if (query.limit) queryParams.set('limit', String(query.limit));
  if (query.search) queryParams.set('search', query.search);
  if (query.sortField) queryParams.set('sortField', query.sortField);
  if (query.sortDir) queryParams.set('sortDir', query.sortDir);
  if (query.includeDeleted) queryParams.set('includeDeleted', 'true');
  
  const queryString = queryParams.toString();

  return useQuery({
    queryKey: [...FINANCE_PAYMENTS_QUERY_KEY, query],
    queryFn: async ({ signal }): Promise<FinancePaymentsListPageResult> =>
      apiJson<FinancePaymentsListPageResult>(
        `${FINANCE_API}/payments${queryString ? `?${queryString}` : ''}`,
        { signal },
      ),
    enabled,
    placeholderData: keepPreviousData,
  });
}

/** @deprecated Use useFinanceInvoicesPaginated instead */
export function useFinanceInvoicesCollection(options?: { enabled?: boolean; includeDeleted?: boolean }): Invoice[] {
  const query = useFinanceInvoicesPaginated({ page: 1, limit: 500, includeDeleted: options?.includeDeleted }, options);
  return query.data?.invoices ?? [];
}

/** @deprecated Use useFinancePaymentsPaginated instead */
export function useFinancePaymentsCollection(options?: { enabled?: boolean; includeDeleted?: boolean }): Payment[] {
  const query = useFinancePaymentsPaginated({ page: 1, limit: 500, includeDeleted: options?.includeDeleted }, options);
  return query.data?.payments ?? [];
}

export function useFinanceReportAggregates(
  options?: { enabled?: boolean; comparison?: FinanceReportComparisonQuery },
) {
  const { isAuthenticated } = useAuth();
  const enabled = options?.enabled ?? true;
  const comparison = normalizeFinanceReportComparisonQuery(options?.comparison);
  const queryParams = new URLSearchParams();
  if (comparison?.sessionIds?.length) queryParams.set('sessionIds', comparison.sessionIds.join(','));
  if (comparison?.rangeAFrom) queryParams.set('rangeAFrom', comparison.rangeAFrom);
  if (comparison?.rangeATo) queryParams.set('rangeATo', comparison.rangeATo);
  if (comparison?.rangeBFrom) queryParams.set('rangeBFrom', comparison.rangeBFrom);
  if (comparison?.rangeBTo) queryParams.set('rangeBTo', comparison.rangeBTo);
  const queryString = queryParams.toString();

  return useQuery({
    queryKey: [...FINANCE_REPORT_AGGREGATES_QUERY_KEY, comparison ?? null] as const,
    queryFn: async ({ signal }): Promise<FinanceReportAggregates> =>
      apiJson<FinanceReportAggregates>(
        `${FINANCE_API}/report-aggregates${queryString ? `?${queryString}` : ''}`,
        { signal },
      ),
    enabled: isAuthenticated && enabled,
    staleTime: 30_000,
  });
}

export function useFinanceMutations() {
  const queryClient = useQueryClient();

  const invalidateAll = () => {
    void queryClient.invalidateQueries({ queryKey: FINANCE_INVOICES_QUERY_KEY });
    void queryClient.invalidateQueries({ queryKey: FINANCE_PAYMENTS_QUERY_KEY });
    void queryClient.invalidateQueries({ queryKey: FINANCE_METRICS_QUERY_KEY });
  };

  const createInvoice = useMutation({
    mutationFn: async (invoice: InvoiceCreateInput) =>
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

  const restoreInvoice = useMutation({
    mutationFn: async (id: string) =>
      apiFetch(`${FINANCE_API}/invoices/${id}/restore`, { method: 'POST' }),
    onSuccess: invalidateAll,
  });

  const bulkDeleteInvoices = useMutation({
    mutationFn: async (ids: string[]) =>
      apiJson<{ success: boolean; succeeded: number; failed: number }>(`${FINANCE_API}/invoices/bulk-delete`, {
        method: 'POST',
        body: JSON.stringify({ ids }),
      }),
    onSuccess: invalidateAll,
  });

  const bulkRestoreInvoices = useMutation({
    mutationFn: async (ids: string[]) =>
      apiJson<{ success: boolean; succeeded: number; failed: number }>(`${FINANCE_API}/invoices/bulk-restore`, {
        method: 'POST',
        body: JSON.stringify({ ids }),
      }),
    onSuccess: invalidateAll,
  });

  const bulkUpdateInvoiceStatus = useMutation({
    mutationFn: async (body: InvoicesBulkStatusBody) =>
      apiJson<{ success: boolean; succeeded: number; failed: number }>(
        `${FINANCE_API}/invoices/bulk-status`,
        { method: 'POST', body: JSON.stringify(body) },
      ),
    onSuccess: invalidateAll,
  });

  const createPayment = useMutation({
    mutationFn: async (payment: PaymentCreateInput) =>
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

  const restorePayment = useMutation({
    mutationFn: async (id: string) =>
      apiFetch(`${FINANCE_API}/payments/${id}/restore`, { method: 'POST' }),
    onSuccess: invalidateAll,
  });

  const bulkDeletePayments = useMutation({
    mutationFn: async (ids: string[]) =>
      apiJson<{ success: boolean; succeeded: number; failed: number }>(`${FINANCE_API}/payments/bulk-delete`, {
        method: 'POST',
        body: JSON.stringify({ ids }),
      }),
    onSuccess: invalidateAll,
  });

  const bulkRestorePayments = useMutation({
    mutationFn: async (ids: string[]) =>
      apiJson<{ success: boolean; succeeded: number; failed: number }>(`${FINANCE_API}/payments/bulk-restore`, {
        method: 'POST',
        body: JSON.stringify({ ids }),
      }),
    onSuccess: invalidateAll,
  });

  return {
    createInvoice,
    updateInvoice,
    deleteInvoice,
    restoreInvoice,
    bulkDeleteInvoices,
    bulkRestoreInvoices,
    bulkUpdateInvoiceStatus,
    createPayment,
    updatePayment,
    deletePayment,
    restorePayment,
    bulkDeletePayments,
    bulkRestorePayments,
  };
}
