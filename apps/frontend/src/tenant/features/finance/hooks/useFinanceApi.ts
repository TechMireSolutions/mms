
import type {
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
import { useAuth } from '@/lib/contexts/AuthContext';
import {
  useFinanceContractInvoices,
  useFinanceContractPayments,
  useFinanceContractReportAggregates
} from '@/tenant/features/finance/hooks/useFinanceTsrHooks';

export const FINANCE_INVOICES_QUERY_KEY = ['finance', 'invoices', 'list'] as const;
export const FINANCE_PAYMENTS_QUERY_KEY = ['finance', 'payments', 'list'] as const;
export const FINANCE_METRICS_QUERY_KEY = ['finance', 'metrics'] as const;
export const FINANCE_REPORT_AGGREGATES_QUERY_KEY = [
  FINANCE_MODULE_MANIFEST.collectionKey,
  'report-aggregates',
] as const;

const FINANCE_API = FINANCE_MODULE_MANIFEST.restBasePath;




export function useFinanceInvoicesPaginated(query: FinanceListQuery, options?: { enabled?: boolean }): Omit<any, 'data'> & { data: FinanceInvoicesListPageResult | undefined } {
  const { isAuthenticated } = useAuth();
  const enabled = (options?.enabled ?? true) && isAuthenticated;
  
  const queryParams: Record<string, unknown> = {};
  if (query.page) queryParams.page = query.page;
  if (query.limit) queryParams.limit = query.limit;
  if (query.search) queryParams.search = query.search;
  if (query.sortField) queryParams.sortField = query.sortField;
  if (query.sortDir) queryParams.sortDir = query.sortDir;
  if (query.includeDeleted) queryParams.includeDeleted = 'true';
  
  const result = useFinanceContractInvoices(queryParams, enabled);
  return {
    ...result,
    data: result.data?.status === 200 ? (result.data.body as FinanceInvoicesListPageResult) : undefined,
  };
}

export function useFinancePaymentsPaginated(query: FinanceListQuery, options?: { enabled?: boolean }): Omit<any, 'data'> & { data: FinancePaymentsListPageResult | undefined } {
  const { isAuthenticated } = useAuth();
  const enabled = (options?.enabled ?? true) && isAuthenticated;
  
  const queryParams: Record<string, unknown> = {};
  if (query.page) queryParams.page = query.page;
  if (query.limit) queryParams.limit = query.limit;
  if (query.search) queryParams.search = query.search;
  if (query.sortField) queryParams.sortField = query.sortField;
  if (query.sortDir) queryParams.sortDir = query.sortDir;
  if (query.includeDeleted) queryParams.includeDeleted = 'true';
  
  const result = useFinanceContractPayments(queryParams, enabled);
  return {
    ...result,
    data: result.data?.status === 200 ? (result.data.body as FinancePaymentsListPageResult) : undefined,
  };
}



export function useFinanceReportAggregates(
  options?: { enabled?: boolean; comparison?: FinanceReportComparisonQuery },
) {
  const { isAuthenticated } = useAuth();
  const enabled = options?.enabled ?? true;
  const comparison = normalizeFinanceReportComparisonQuery(options?.comparison);
  
  const queryParams: Record<string, unknown> = {};
  if (comparison?.sessionIds?.length) queryParams.sessionIds = comparison.sessionIds.join(',');
  if (comparison?.rangeAFrom) queryParams.rangeAFrom = comparison.rangeAFrom;
  if (comparison?.rangeATo) queryParams.rangeATo = comparison.rangeATo;
  if (comparison?.rangeBFrom) queryParams.rangeBFrom = comparison.rangeBFrom;
  if (comparison?.rangeBTo) queryParams.rangeBTo = comparison.rangeBTo;
  
  return useFinanceContractReportAggregates(queryParams, isAuthenticated && enabled);
}

import {
  useFinanceContractCreateInvoice,
  useFinanceContractUpdateInvoice,
  useFinanceContractDeleteInvoice,
  useFinanceContractCreatePayment,
  useFinanceContractUpdatePayment,
  useFinanceContractDeletePayment,
  useFinanceContractBulkDeleteInvoices,
  useFinanceContractBulkStatusInvoices,
  useFinanceContractRestoreInvoice,
  useFinanceContractRestorePayment,
  useFinanceContractBulkRestoreInvoices,
  useFinanceContractBulkRestorePayments,
  useFinanceContractBulkDeletePayments,
} from '@/tenant/features/finance/hooks/useFinanceTsrHooks';
import { useQueryClient } from '@tanstack/react-query';

export function useFinanceMutations() {
  const queryClient = useQueryClient();

  const createInvoice = useFinanceContractCreateInvoice();
  const updateInvoice = useFinanceContractUpdateInvoice();
  const deleteInvoice = useFinanceContractDeleteInvoice();
  const restoreInvoice = useFinanceContractRestoreInvoice();
  
  const bulkDeleteInvoices = useFinanceContractBulkDeleteInvoices();
  const bulkRestoreInvoices = useFinanceContractBulkRestoreInvoices();
  const bulkUpdateInvoiceStatus = useFinanceContractBulkStatusInvoices();

  const createPayment = useFinanceContractCreatePayment();
  const updatePayment = useFinanceContractUpdatePayment();
  const deletePayment = useFinanceContractDeletePayment();
  const restorePayment = useFinanceContractRestorePayment();

  const bulkDeletePayments = useFinanceContractBulkDeletePayments();
  const bulkRestorePayments = useFinanceContractBulkRestorePayments();

  return {
    createInvoice: {
      ...createInvoice,
      mutate: (invoice: InvoiceCreateInput, opts?: any) => createInvoice.mutate({ body: invoice }, opts),
      mutateAsync: (invoice: InvoiceCreateInput) => createInvoice.mutateAsync({ body: invoice }),
    },
    updateInvoice: {
      ...updateInvoice,
      mutate: ({ id, invoice }: { id: string; invoice: Invoice }, opts?: any) =>
        updateInvoice.mutate({ params: { id }, body: invoice }, opts),
      mutateAsync: ({ id, invoice }: { id: string; invoice: Invoice }) =>
        updateInvoice.mutateAsync({ params: { id }, body: invoice }),
    },
    deleteInvoice: {
      ...deleteInvoice,
      mutate: (id: string, opts?: any) => deleteInvoice.mutate({ params: { id } }, opts),
      mutateAsync: (id: string) => deleteInvoice.mutateAsync({ params: { id } }),
    },
    restoreInvoice: restoreInvoice ? {
      ...restoreInvoice,
      mutate: (id: string, opts?: any) => restoreInvoice.mutate({ params: { id } }, opts),
      mutateAsync: (id: string) => restoreInvoice.mutateAsync({ params: { id } }),
    } : null,
    bulkDeleteInvoices: {
      ...bulkDeleteInvoices,
      mutate: (ids: string[], opts?: any) => bulkDeleteInvoices.mutate({ body: { ids } }, opts),
      mutateAsync: (ids: string[]) => bulkDeleteInvoices.mutateAsync({ body: { ids } }),
    },
    bulkRestoreInvoices: bulkRestoreInvoices ? {
      ...bulkRestoreInvoices,
      mutate: (ids: string[], opts?: any) => bulkRestoreInvoices.mutate({ body: { ids } }, opts),
      mutateAsync: (ids: string[]) => bulkRestoreInvoices.mutateAsync({ body: { ids } }),
    } : null,
    bulkUpdateInvoiceStatus: {
      ...bulkUpdateInvoiceStatus,
      mutate: (body: InvoicesBulkStatusBody, opts?: any) => bulkUpdateInvoiceStatus.mutate({ body }, opts),
      mutateAsync: (body: InvoicesBulkStatusBody) => bulkUpdateInvoiceStatus.mutateAsync({ body }),
    },
    createPayment: {
      ...createPayment,
      mutate: (payment: PaymentCreateInput, opts?: any) => createPayment.mutate({ body: payment }, opts),
      mutateAsync: (payment: PaymentCreateInput) => createPayment.mutateAsync({ body: payment }),
    },
    updatePayment: {
      ...updatePayment,
      mutate: ({ id, payment }: { id: string; payment: Payment }, opts?: any) =>
        updatePayment.mutate({ params: { id }, body: payment }, opts),
      mutateAsync: ({ id, payment }: { id: string; payment: Payment }) =>
        updatePayment.mutateAsync({ params: { id }, body: payment }),
    },
    deletePayment: {
      ...deletePayment,
      mutate: (id: string, opts?: any) => deletePayment.mutate({ params: { id } }, opts),
      mutateAsync: (id: string) => deletePayment.mutateAsync({ params: { id } }),
    },
    restorePayment: restorePayment ? {
      ...restorePayment,
      mutate: (id: string, opts?: any) => restorePayment.mutate({ params: { id } }, opts),
      mutateAsync: (id: string) => restorePayment.mutateAsync({ params: { id } }),
    } : null,
    bulkDeletePayments: {
      ...bulkDeletePayments,
      mutate: (ids: string[], opts?: any) => bulkDeletePayments.mutate({ body: { ids } }, opts),
      mutateAsync: (ids: string[]) => bulkDeletePayments.mutateAsync({ body: { ids } }),
    },
    bulkRestorePayments: bulkRestorePayments ? {
      ...bulkRestorePayments,
      mutate: (ids: string[], opts?: any) => bulkRestorePayments.mutate({ body: { ids } }, opts),
      mutateAsync: (ids: string[]) => bulkRestorePayments.mutateAsync({ body: { ids } }),
    } : null,
  };
}

