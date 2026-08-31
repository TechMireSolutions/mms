/**
 * Phase 7: Contract-driven query/mutation hooks for the Accounting module.
 * Uses tsrClient (@ts-rest/react-query v5) for full contract schema enforcement.
 */
import { tsrClient } from '@/lib/api';
import { useQueryClient } from '@tanstack/react-query';
import { invalidateAccountingQueries } from '@/tenant/features/accounting/hooks/invalidateAccountingQueries';
import {
  ACCOUNTING_ACCOUNTS_QUERY_KEY,
  ACCOUNTING_ENTRIES_QUERY_KEY,
  ACCOUNTING_FISCAL_YEARS_QUERY_KEY,
} from '@/tenant/features/accounting/hooks/useAccountingApi';

export function useAccountingContractAccounts(query: Record<string, unknown>, enabled = true) {
  // @ts-expect-error - TS union discrimination limit with ts-rest
  return tsrClient.accounting.listAccounts.useQuery({
    queryKey: [...ACCOUNTING_ACCOUNTS_QUERY_KEY, 'contract', query],
    queryData: { query },
    staleTime: 15_000,
    enabled,
  });
}

export function useAccountingContractEntries(query: Record<string, unknown>, enabled = true) {
  // @ts-expect-error - TS union discrimination limit with ts-rest
  return tsrClient.accounting.listEntries.useQuery({
    queryKey: [...ACCOUNTING_ENTRIES_QUERY_KEY, 'contract', query],
    queryData: { query },
    staleTime: 15_000,
    enabled,
  });
}

export function useAccountingContractFiscalYears(query: Record<string, unknown>, enabled = true) {
  // @ts-expect-error - TS union discrimination limit with ts-rest
  return tsrClient.accounting.listFiscalYears.useQuery({
    queryKey: [...ACCOUNTING_FISCAL_YEARS_QUERY_KEY, 'contract', query],
    queryData: { query },
    staleTime: 15_000,
    enabled,
  });
}

export function useAccountingContractReplaceAccounts() {
  const queryClient = useQueryClient();
  // @ts-expect-error - TS union discrimination limit with ts-rest
  return tsrClient.accounting.replaceAccounts.useMutation({
    onSuccess: () => invalidateAccountingQueries(queryClient),
  });
}

export function useAccountingContractReplaceEntries() {
  const queryClient = useQueryClient();
  // @ts-expect-error - TS union discrimination limit with ts-rest
  return tsrClient.accounting.replaceEntries.useMutation({
    onSuccess: () => invalidateAccountingQueries(queryClient),
  });
}

export function useAccountingContractReplaceFiscalYears() {
  const queryClient = useQueryClient();
  // @ts-expect-error - TS union discrimination limit with ts-rest
  return tsrClient.accounting.replaceFiscalYears.useMutation({
    onSuccess: () => invalidateAccountingQueries(queryClient),
  });
}

export function useAccountingContractDeleteEntry() {
  const queryClient = useQueryClient();
  // @ts-expect-error - TS union discrimination limit with ts-rest
  return tsrClient.accounting.deleteEntry.useMutation({
    onSuccess: () => invalidateAccountingQueries(queryClient),
  });
}

export function useAccountingContractRestoreEntry() {
  const queryClient = useQueryClient();
  // @ts-expect-error - TS union discrimination limit with ts-rest
  return tsrClient.accounting.restoreEntry.useMutation({
    onSuccess: () => invalidateAccountingQueries(queryClient),
  });
}

export function useAccountingContractBulkDeleteEntries() {
  const queryClient = useQueryClient();
  // @ts-expect-error - TS union discrimination limit with ts-rest
  return tsrClient.accounting.bulkDeleteEntries.useMutation({
    onSuccess: () => invalidateAccountingQueries(queryClient),
  });
}

export function useAccountingContractBulkRestoreEntries() {
  const queryClient = useQueryClient();
  // @ts-expect-error - TS union discrimination limit with ts-rest
  return tsrClient.accounting.bulkRestoreEntries.useMutation({
    onSuccess: () => invalidateAccountingQueries(queryClient),
  });
}
