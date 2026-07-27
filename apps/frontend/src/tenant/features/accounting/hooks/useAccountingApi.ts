import { useMutation, useQueryClient } from '@tanstack/react-query';
import type {
  AccountingCommandMetricsSnapshot,
  Account,
  JournalEntry,
  FiscalYear,
} from '@mms/shared';
import { ACCOUNTING_MODULE_MANIFEST } from '@mms/shared';
import { useServerMetrics } from '@/hooks/useServerMetrics';
import { apiJson } from '@/lib/apiClient';
import { saveCollection } from '@/lib/db';
import { useCollectionSync } from '@/hooks/useCollectionSync';

const ACCOUNTING_API = ACCOUNTING_MODULE_MANIFEST.restBasePath;

export const ACCOUNTING_METRICS_QUERY_KEY = [ACCOUNTING_MODULE_MANIFEST.moduleId, 'metrics'] as const;

export const ACCOUNTING_ACCOUNTS_QUERY_KEY = [ACCOUNTING_MODULE_MANIFEST.moduleId, 'accounts', 'list'] as const;
export const ACCOUNTING_ENTRIES_QUERY_KEY = [ACCOUNTING_MODULE_MANIFEST.moduleId, 'entries', 'list'] as const;
export const ACCOUNTING_FISCAL_YEARS_QUERY_KEY = [ACCOUNTING_MODULE_MANIFEST.moduleId, 'fiscal_years', 'list'] as const;

export class NotifiedAccountingMutationError extends Error {}

export function useAccountingAccounts(options?: { enabled?: boolean; includeDeleted?: boolean }) {
  const includeDeleted = options?.includeDeleted ?? false;
  return useCollectionSync<Account>({
    queryKey: [...ACCOUNTING_ACCOUNTS_QUERY_KEY, { includeDeleted }],
    apiPath: `${ACCOUNTING_API}/accounts?includeDeleted=${includeDeleted}`,
    responseKey: 'accounts',
    collectionName: 'accounting_accounts',
    enabled: options?.enabled,
    isSuccessQuery: (res) => res.isSuccess && (res.data?.length ?? 0) > 0,
  });
}

export function useAccountingAccountsCollection(options?: { enabled?: boolean; includeDeleted?: boolean }): Account[] {
  return useAccountingAccounts(options).syncedData;
}

export function useAccountingEntries(options?: { enabled?: boolean; includeDeleted?: boolean }) {
  const includeDeleted = options?.includeDeleted ?? false;
  return useCollectionSync<JournalEntry>({
    queryKey: [...ACCOUNTING_ENTRIES_QUERY_KEY, { includeDeleted }],
    apiPath: `${ACCOUNTING_API}/entries?includeDeleted=${includeDeleted}`,
    responseKey: 'entries',
    collectionName: 'accounting_entries',
    enabled: options?.enabled,
    isSuccessQuery: (res) => res.isSuccess && (res.data?.length ?? 0) > 0,
  });
}

export function useAccountingEntriesCollection(options?: { enabled?: boolean; includeDeleted?: boolean }): JournalEntry[] {
  return useAccountingEntries(options).syncedData;
}

export function useAccountingFiscalYears(options?: { enabled?: boolean }) {
  return useCollectionSync<FiscalYear>({
    queryKey: ACCOUNTING_FISCAL_YEARS_QUERY_KEY,
    apiPath: `${ACCOUNTING_API}/fiscal-years`,
    responseKey: 'fiscalYears',
    collectionName: 'accounting_fiscal_years',
    enabled: options?.enabled,
    isSuccessQuery: (res) => res.isSuccess && (res.data?.length ?? 0) > 0,
  });
}

export function useAccountingFiscalYearsCollection(options?: { enabled?: boolean }): FiscalYear[] {
  return useAccountingFiscalYears(options).syncedData;
}

export function useAccountingMutations() {
  const queryClient = useQueryClient();

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ACCOUNTING_ACCOUNTS_QUERY_KEY });
    void queryClient.invalidateQueries({ queryKey: ACCOUNTING_ENTRIES_QUERY_KEY });
    void queryClient.invalidateQueries({ queryKey: ACCOUNTING_FISCAL_YEARS_QUERY_KEY });
    void queryClient.invalidateQueries({ queryKey: ACCOUNTING_METRICS_QUERY_KEY });
  };

  const replaceAccounts = useMutation({
    mutationFn: async (accounts: Account[]) =>
      apiJson<{ accounts: Account[] }>(`${ACCOUNTING_API}/accounts/bulk`, {
        method: 'PUT',
        body: JSON.stringify(accounts),
      }),
    onSuccess: (accountsResponse) => {
      saveCollection('accounting_accounts', accountsResponse.accounts);
      invalidate();
    },
  });

  const replaceEntries = useMutation({
    mutationFn: async (entries: JournalEntry[]) =>
      apiJson<{ entries: JournalEntry[] }>(`${ACCOUNTING_API}/entries/bulk`, {
        method: 'PUT',
        body: JSON.stringify(entries),
      }),
    onSuccess: (entriesResponse) => {
      saveCollection('accounting_entries', entriesResponse.entries);
      invalidate();
    },
  });

  const replaceFiscalYears = useMutation({
    mutationFn: async (fiscalYears: FiscalYear[]) =>
      apiJson<{ fiscalYears: FiscalYear[] }>(`${ACCOUNTING_API}/fiscal-years/bulk`, {
        method: 'PUT',
        body: JSON.stringify(fiscalYears),
      }),
    onSuccess: (fiscalYearsResponse) => {
      saveCollection('accounting_fiscal_years', fiscalYearsResponse.fiscalYears);
      invalidate();
    },
  });

  const deleteEntry = useMutation({
    mutationFn: async (id: string) =>
      apiJson<{ success: boolean }>(`${ACCOUNTING_API}/entries/${encodeURIComponent(id)}`, {
        method: 'DELETE',
      }),
    onSuccess: () => invalidate(),
  });

  const restoreEntry = useMutation({
    mutationFn: async (id: string) =>
      apiJson<{ success: boolean }>(`${ACCOUNTING_API}/entries/${encodeURIComponent(id)}/restore`, {
        method: 'POST',
      }),
    onSuccess: () => invalidate(),
  });

  const bulkDeleteEntries = useMutation({
    mutationFn: async (ids: string[]) =>
      apiJson<{ success: boolean; succeeded: number; failed: number }>(
        `${ACCOUNTING_API}/entries/bulk-delete`,
        {
          method: 'POST',
          body: JSON.stringify({ ids }),
        },
      ),
    onSuccess: () => invalidate(),
  });

  const bulkRestoreEntries = useMutation({
    mutationFn: async (ids: string[]) =>
      apiJson<{ success: boolean; succeeded: number; failed: number }>(
        `${ACCOUNTING_API}/entries/bulk-restore`,
        {
          method: 'POST',
          body: JSON.stringify({ ids }),
        },
      ),
    onSuccess: () => invalidate(),
  });

  return {
    replaceAccounts,
    replaceEntries,
    replaceFiscalYears,
    deleteEntry,
    restoreEntry,
    bulkDeleteEntries,
    bulkRestoreEntries,
  };
}

export function useAccountingMetrics(options?: { enabled?: boolean }) {
  return useServerMetrics<AccountingCommandMetricsSnapshot>({
    moduleId: ACCOUNTING_MODULE_MANIFEST.moduleId,
    apiPath: ACCOUNTING_MODULE_MANIFEST.restBasePath,
    enabled: options?.enabled,
  });
}
