import { useQueryClient, keepPreviousData } from '@tanstack/react-query';
import type {
  AccountingCommandMetricsSnapshot,
  AccountingListQuery,
  Account,
  JournalEntry,
  FiscalYear,
} from '@mms/shared';
import { ACCOUNTING_MODULE_MANIFEST } from '@mms/shared';
import { useServerMetrics } from '@/hooks/useServerMetrics';
import { useAuth } from '@/lib/contexts/AuthContext';
import { tsrClient } from '@/lib/api';

export const ACCOUNTING_METRICS_QUERY_KEY = [ACCOUNTING_MODULE_MANIFEST.moduleId, 'metrics'] as const;

export const ACCOUNTING_ACCOUNTS_QUERY_KEY = [ACCOUNTING_MODULE_MANIFEST.moduleId, 'accounts', 'list'] as const;
export const ACCOUNTING_ENTRIES_QUERY_KEY = [ACCOUNTING_MODULE_MANIFEST.moduleId, 'entries', 'list'] as const;
export const ACCOUNTING_FISCAL_YEARS_QUERY_KEY = [ACCOUNTING_MODULE_MANIFEST.moduleId, 'fiscal_years', 'list'] as const;

export function useAccountingAccountsPaginated(query: AccountingListQuery, options?: { enabled?: boolean }) {
  const { isAuthenticated } = useAuth();
  const enabled = (options?.enabled ?? true) && isAuthenticated;
  
  // @ts-expect-error - TS union discrimination limit with ts-rest
  return tsrClient.accounting.listAccounts.useQuery({
    queryKey: [...ACCOUNTING_ACCOUNTS_QUERY_KEY, query] as any,
    queryData: {
      query: {
        page: query.page,
        limit: query.limit,
        search: query.search,
        sortField: query.sortField,
        sortDir: query.sortDir,
        includeDeleted: query.includeDeleted ? 'true' : undefined,
      } as any,
    },
    enabled,
    placeholderData: keepPreviousData,
  });
}

export function useAccountingEntriesPaginated(query: AccountingListQuery, options?: { enabled?: boolean }) {
  const { isAuthenticated } = useAuth();
  const enabled = (options?.enabled ?? true) && isAuthenticated;
  
  // @ts-expect-error - TS union discrimination limit with ts-rest
  return tsrClient.accounting.listEntries.useQuery({
    queryKey: [...ACCOUNTING_ENTRIES_QUERY_KEY, query] as any,
    queryData: {
      query: {
        page: query.page,
        limit: query.limit,
        search: query.search,
        sortField: query.sortField,
        sortDir: query.sortDir,
        includeDeleted: query.includeDeleted ? 'true' : undefined,
      } as any,
    },
    enabled,
    placeholderData: keepPreviousData,
  });
}

export function useAccountingFiscalYearsPaginated(query: AccountingListQuery, options?: { enabled?: boolean }) {
  const { isAuthenticated } = useAuth();
  const enabled = (options?.enabled ?? true) && isAuthenticated;
  
  // @ts-expect-error - TS union discrimination limit with ts-rest
  return tsrClient.accounting.listFiscalYears.useQuery({
    queryKey: [...ACCOUNTING_FISCAL_YEARS_QUERY_KEY, query] as any,
    queryData: {
      query: {
        page: query.page,
        limit: query.limit,
        search: query.search,
        sortField: query.sortField,
        sortDir: query.sortDir,
        includeDeleted: query.includeDeleted ? 'true' : undefined,
      } as any,
    },
    enabled,
    placeholderData: keepPreviousData,
  });
}


export function useAccountingMutations() {
  const queryClient = useQueryClient();

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ACCOUNTING_ACCOUNTS_QUERY_KEY });
    void queryClient.invalidateQueries({ queryKey: ACCOUNTING_ENTRIES_QUERY_KEY });
    void queryClient.invalidateQueries({ queryKey: ACCOUNTING_FISCAL_YEARS_QUERY_KEY });
    void queryClient.invalidateQueries({ queryKey: ACCOUNTING_METRICS_QUERY_KEY });
  };

  // @ts-expect-error - TS union discrimination limit with ts-rest
  const replaceAccounts = tsrClient.accounting.replaceAccounts.useMutation({
    onSuccess: () => {
      invalidate();
    },
  });

  // @ts-expect-error - TS union discrimination limit with ts-rest
  const replaceEntries = tsrClient.accounting.replaceEntries.useMutation({
    onSuccess: () => {
      invalidate();
    },
  });

  // @ts-expect-error - TS union discrimination limit with ts-rest
  const replaceFiscalYears = tsrClient.accounting.replaceFiscalYears.useMutation({
    onSuccess: () => {
      invalidate();
    },
  });

  // @ts-expect-error - TS union discrimination limit with ts-rest
  const deleteEntry = tsrClient.accounting.deleteEntry.useMutation({
    onSuccess: () => invalidate(),
  });

  // @ts-expect-error - TS union discrimination limit with ts-rest
  const restoreEntry = tsrClient.accounting.restoreEntry.useMutation({
    onSuccess: () => invalidate(),
  });

  // @ts-expect-error - TS union discrimination limit with ts-rest
  const bulkDeleteEntries = tsrClient.accounting.bulkDeleteEntries.useMutation({
    onSuccess: () => invalidate(),
  });

  // @ts-expect-error - TS union discrimination limit with ts-rest
  const bulkRestoreEntries = tsrClient.accounting.bulkRestoreEntries.useMutation({
    onSuccess: () => invalidate(),
  });

  return {
    replaceAccounts: {
      ...replaceAccounts,
      mutate: (accounts: Account[], opts?: any) => replaceAccounts.mutate({ body: accounts }, opts),
      mutateAsync: (accounts: Account[]) => replaceAccounts.mutateAsync({ body: accounts }),
    },
    replaceEntries: {
      ...replaceEntries,
      mutate: (entries: JournalEntry[], opts?: any) => replaceEntries.mutate({ body: entries }, opts),
      mutateAsync: (entries: JournalEntry[]) => replaceEntries.mutateAsync({ body: entries }),
    },
    replaceFiscalYears: {
      ...replaceFiscalYears,
      mutate: (fiscalYears: FiscalYear[], opts?: any) => replaceFiscalYears.mutate({ body: fiscalYears }, opts),
      mutateAsync: (fiscalYears: FiscalYear[]) => replaceFiscalYears.mutateAsync({ body: fiscalYears }),
    },
    deleteEntry: {
      ...deleteEntry,
      mutate: (id: string, opts?: any) => deleteEntry.mutate({ params: { id } }, opts),
      mutateAsync: (id: string) => deleteEntry.mutateAsync({ params: { id } }),
    },
    restoreEntry: {
      ...restoreEntry,
      mutate: (id: string, opts?: any) => restoreEntry.mutate({ params: { id } }, opts),
      mutateAsync: (id: string) => restoreEntry.mutateAsync({ params: { id } }),
    },
    bulkDeleteEntries: {
      ...bulkDeleteEntries,
      mutate: (ids: string[], opts?: any) => bulkDeleteEntries.mutate({ body: { ids } }, opts),
      mutateAsync: (ids: string[]) => bulkDeleteEntries.mutateAsync({ body: { ids } }),
    },
    bulkRestoreEntries: {
      ...bulkRestoreEntries,
      mutate: (ids: string[], opts?: any) => bulkRestoreEntries.mutate({ body: { ids } }, opts),
      mutateAsync: (ids: string[]) => bulkRestoreEntries.mutateAsync({ body: { ids } }),
    },
  };
}

export function useAccountingMetrics(options?: { enabled?: boolean }) {
  return useServerMetrics<AccountingCommandMetricsSnapshot>({
    moduleId: ACCOUNTING_MODULE_MANIFEST.moduleId,
    apiPath: ACCOUNTING_MODULE_MANIFEST.restBasePath,
    enabled: options?.enabled,
  });
}
