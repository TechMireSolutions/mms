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
  useFinanceInvoicesCollection,
  useFinancePaymentsCollection,
  useFinanceReportAggregates,
  useFinanceMutations,
} from "@/tenant/features/finance/hooks/useFinanceApi";
export { useFinanceMetrics } from "@/tenant/features/finance/hooks/useFinanceMetrics";
export { invalidateFinanceQueries } from '@/tenant/features/finance/hooks/invalidateFinanceQueries';
export {
  FINANCE_FIELD_CONFIG_QUERY_KEY,
  FINANCE_PREFERENCES_QUERY_KEY,
  useFinanceFieldConfigQuery,
  useFinanceFieldConfigMutation,
  useFinancePreferencesQuery,
  useFinancePreferencesMutation,
  useComposedFinanceSettings,
} from "@/tenant/features/finance/hooks/useFinanceSetupConfig";
