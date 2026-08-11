/**
 * Cross-module public surface for Accounting Query hooks.
 * Other features and shared UI must import from here — not `@/tenant/features/accounting/hooks/*`.
 */
export {
  useAccountingAccounts,
  useAccountingAccountsCollection,
  useAccountingEntries,
  useAccountingEntriesCollection,
  useAccountingFiscalYears,
  useAccountingFiscalYearsCollection,
  useAccountingMutations,
  useAccountingMetrics,
} from "@/tenant/features/accounting/hooks/useAccountingApi";
export { invalidateAccountingQueries } from '@/tenant/features/accounting/hooks/invalidateAccountingQueries';
