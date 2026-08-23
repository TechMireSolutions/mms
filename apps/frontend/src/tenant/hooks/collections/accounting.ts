/**
 * Cross-module public surface for Accounting Query hooks.
 * Other features and shared UI must import from here — not `@/tenant/features/accounting/hooks/*`.
 */
export {
  useAccountingAccountsPaginated,
  useAccountingEntriesPaginated,
  useAccountingFiscalYearsPaginated,
  useAccountingMutations,
  useAccountingMetrics,
} from "@/tenant/features/accounting/hooks/useAccountingApi";
export { invalidateAccountingQueries } from '@/tenant/features/accounting/hooks/invalidateAccountingQueries';
// Phase 7: contract-driven tsrClient hooks
export {
  useAccountingContractAccounts,
  useAccountingContractEntries,
  useAccountingContractFiscalYears,
  useAccountingContractReplaceAccounts,
  useAccountingContractReplaceEntries,
  useAccountingContractReplaceFiscalYears,
  useAccountingContractDeleteEntry,
  useAccountingContractRestoreEntry,
  useAccountingContractBulkDeleteEntries,
  useAccountingContractBulkRestoreEntries,
} from '@/tenant/features/accounting/hooks/useAccountingTsrHooks';
