/**
 * Cross-module public surface for Finance Query hooks.
 * Other features and shared UI must import from here — not `@/tenant/features/finance/hooks/*`.
 */
export {
  useFinanceInvoices,
  useFinancePayments,
  useFinanceInvoicesCollection,
  useFinancePaymentsCollection,
  useFinanceMutations,
} from "@/tenant/features/finance/hooks/useFinanceApi";
