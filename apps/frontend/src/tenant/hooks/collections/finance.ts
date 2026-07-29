/**
 * Cross-module public surface for Finance Query hooks.
 * Other features and shared UI must import from here — not `@/tenant/features/finance/hooks/*`.
 */
export {
  FINANCE_INVOICES_QUERY_KEY,
  FINANCE_PAYMENTS_QUERY_KEY,
  FINANCE_METRICS_QUERY_KEY,
  useFinanceInvoices,
  useFinancePayments,
  useFinanceInvoicesCollection,
  useFinancePaymentsCollection,
  useFinanceMutations,
} from "@/tenant/features/finance/hooks/useFinanceApi";
