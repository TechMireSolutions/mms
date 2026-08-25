/**
 * Cross-module public surface for Finance Query hooks.
 * Other features and shared UI must import from here — not `@/tenant/features/finance/hooks/*`.
 */
export {
  FINANCE_INVOICES_QUERY_KEY,
  FINANCE_PAYMENTS_QUERY_KEY,
  FINANCE_METRICS_QUERY_KEY,
  FINANCE_REPORT_AGGREGATES_QUERY_KEY,
  useFinanceInvoicesPaginated,
  useFinancePaymentsPaginated,
  useFinanceReportAggregates,
  useFinanceMutations,
} from "@/tenant/features/finance/hooks/useFinanceApi";
export { useFinanceMetrics } from "@/tenant/features/finance/hooks/useFinanceMetrics";
export { invalidateFinanceQueries } from '@/tenant/features/finance/hooks/invalidateFinanceQueries';
// Phase 7: contract-driven tsrClient hooks
export {
  useFinanceContractInvoices,
  useFinanceContractPayments,
  useFinanceContractMetrics,
  useFinanceContractCreateInvoice,
  useFinanceContractUpdateInvoice,
  useFinanceContractDeleteInvoice,
  useFinanceContractCreatePayment,
  useFinanceContractUpdatePayment,
  useFinanceContractBulkDeleteInvoices,
  useFinanceContractBulkStatusInvoices,
} from '@/tenant/features/finance/hooks/useFinanceTsrHooks';
