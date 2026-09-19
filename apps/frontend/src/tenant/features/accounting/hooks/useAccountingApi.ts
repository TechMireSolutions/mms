import { useMutation, useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { fetchAllAccountingAccounts, fetchAllAccountingEntries } from './accountingListFetch';
import type { MutateOptions } from '@tanstack/react-query';
import type {
  AccountingCommandMetricsSnapshot,
  AccountingListQuery,
  AccountingReportAggregates,
  AccountingReportQuery,
  Account,
  JournalEntry,
  FiscalYear,
  SpecializedEntryInput,
  SpecializedEntryResult,
} from '@mms/shared';
import { ACCOUNTING_MODULE_MANIFEST, FINANCE_MODULE_MANIFEST } from '@mms/shared';
import { serverMetricsQueryOptions, useServerMetrics } from '@/hooks/useServerMetrics';
import { useAuth } from '@/lib/contexts/AuthContext';
import { tsrClient } from '@/lib/api';
import { apiJson } from '@/lib/apiClient';

export const ACCOUNTING_METRICS_QUERY_KEY = [ACCOUNTING_MODULE_MANIFEST.moduleId, 'metrics'] as const;
export const ACCOUNTING_REPORT_AGGREGATES_QUERY_KEY = [ACCOUNTING_MODULE_MANIFEST.moduleId, 'report-aggregates'] as const;

export function accountingCommandMetricsQueryOptions() {
  return serverMetricsQueryOptions<AccountingCommandMetricsSnapshot>({
    moduleId: ACCOUNTING_MODULE_MANIFEST.moduleId,
    apiPath: ACCOUNTING_MODULE_MANIFEST.restBasePath,
  });
}

export const ACCOUNTING_ACCOUNTS_QUERY_KEY = [ACCOUNTING_MODULE_MANIFEST.moduleId, 'accounts', 'list'] as const;
export const ACCOUNTING_ENTRIES_QUERY_KEY = [ACCOUNTING_MODULE_MANIFEST.moduleId, 'entries', 'list'] as const;
export const ACCOUNTING_FISCAL_YEARS_QUERY_KEY = [ACCOUNTING_MODULE_MANIFEST.moduleId, 'fiscal_years', 'list'] as const;

export function useAccountingAccountsPaginated(query: AccountingListQuery, options?: { enabled?: boolean }) {
  const { isAuthenticated } = useAuth();
  const enabled = (options?.enabled ?? true) && isAuthenticated;
  
  // @ts-expect-error - TS union discrimination limit with ts-rest
  return tsrClient.accounting.listAccounts.useQuery({
    queryKey: [...ACCOUNTING_ACCOUNTS_QUERY_KEY, query],
    queryData: {
      query: {
        page: query.page,
        limit: query.limit,
        search: query.search,
        accountType: query.accountType as never,
        sortField: query.sortField,
        sortDir: query.sortDir,
        includeDeleted: query.includeDeleted ? 'true' : undefined,
      },
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
    queryKey: [...ACCOUNTING_ENTRIES_QUERY_KEY, query],
    queryData: {
      query: {
        page: query.page,
        limit: query.limit,
        search: query.search,
        status: query.status as never,
        dateFrom: query.dateFrom,
        dateTo: query.dateTo,
        accountId: query.accountId,
        sortField: query.sortField,
        sortDir: query.sortDir,
        includeDeleted: query.includeDeleted ? 'true' : undefined,
      },
    },
    enabled,
    placeholderData: keepPreviousData,
  });
}

/**
 * Every entry matching `query`, not just the first page.
 *
 * `computeTrialBalance` / `computeFinancials` / `computeLedger` are whole-ledger
 * aggregates, so a single capped page understates them silently — the previous
 * page-1-of-100 fetch meant the Trial Balance summed the 100 most recently
 * *created* entries while still reporting itself balanced. Pages are requested
 * sequentially at the contract's maximum page size, so each request stays
 * bounded and the result is complete.
 */
export function useAllAccountingEntries(
  query: AccountingListQuery,
  options?: { enabled?: boolean },
) {
  const { isAuthenticated } = useAuth();
  const enabled = (options?.enabled ?? true) && isAuthenticated;

  return useQuery({
    queryKey: [
      ...ACCOUNTING_ENTRIES_QUERY_KEY,
      'all',
      {
        search: query.search,
        status: query.status,
        dateFrom: query.dateFrom,
        dateTo: query.dateTo,
        accountId: query.accountId,
        includeDeleted: query.includeDeleted,
      },
    ],
    queryFn: ({ signal }): Promise<JournalEntry[]> => fetchAllAccountingEntries(query, signal),
    enabled,
  });
}

/** Every account (paged through), for the chart of accounts and the account picker. */
export function useAllAccountingAccounts(options?: {
  includeDeleted?: boolean;
  sortField?: string;
  sortDir?: 'asc' | 'desc';
  enabled?: boolean;
}) {
  const { isAuthenticated } = useAuth();
  const enabled = (options?.enabled ?? true) && isAuthenticated;
  const includeDeleted = options?.includeDeleted ?? false;
  const sortField = options?.sortField ?? 'code';
  const sortDir = options?.sortDir ?? 'asc';

  return useQuery({
    queryKey: [...ACCOUNTING_ACCOUNTS_QUERY_KEY, 'all', { includeDeleted, sortField, sortDir }],
    queryFn: ({ signal }): Promise<Account[]> =>
      fetchAllAccountingAccounts({ includeDeleted, sortField, sortDir }, signal),
    enabled,
    placeholderData: keepPreviousData,
  });
}

export function useAccountingFiscalYearsPaginated(query: AccountingListQuery, options?: { enabled?: boolean }) {
  const { isAuthenticated } = useAuth();
  const enabled = (options?.enabled ?? true) && isAuthenticated;
  
  // @ts-expect-error - TS union discrimination limit with ts-rest
  return tsrClient.accounting.listFiscalYears.useQuery({
    queryKey: [...ACCOUNTING_FISCAL_YEARS_QUERY_KEY, query],
    queryData: {
      query: {
        page: query.page,
        limit: query.limit,
        search: query.search,
        sortField: query.sortField,
        sortDir: query.sortDir,
        includeDeleted: query.includeDeleted ? 'true' : undefined,
      },
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
    // Ledger writes change the report figures too; without this the Reports tier
    // kept serving pre-posting numbers for its 5-minute staleTime window.
    void queryClient.invalidateQueries({ queryKey: ACCOUNTING_REPORT_AGGREGATES_QUERY_KEY });
  };

  // @ts-expect-error - TS union discrimination limit with ts-rest
  const upsertAccounts = tsrClient.accounting.upsertAccounts.useMutation({
    onSuccess: () => {
      invalidate();
    },
  });

  // @ts-expect-error - TS union discrimination limit with ts-rest
  const upsertEntries = tsrClient.accounting.upsertEntries.useMutation({
    onSuccess: () => {
      invalidate();
    },
  });

  // @ts-expect-error - TS union discrimination limit with ts-rest
  const upsertFiscalYears = tsrClient.accounting.upsertFiscalYears.useMutation({
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
    upsertAccounts: {
      ...upsertAccounts,
      mutate: (accounts: Account[], opts?: MutateOptions) => upsertAccounts.mutate({ body: accounts }, opts),
      mutateAsync: (accounts: Account[]) => upsertAccounts.mutateAsync({ body: accounts }),
    },
    upsertEntries: {
      ...upsertEntries,
      mutate: (entries: JournalEntry[], opts?: MutateOptions) => upsertEntries.mutate({ body: entries }, opts),
      mutateAsync: (entries: JournalEntry[]) => upsertEntries.mutateAsync({ body: entries }),
    },
    upsertFiscalYears: {
      ...upsertFiscalYears,
      mutate: (fiscalYears: FiscalYear[], opts?: MutateOptions) => upsertFiscalYears.mutate({ body: fiscalYears }, opts),
      mutateAsync: (fiscalYears: FiscalYear[]) => upsertFiscalYears.mutateAsync({ body: fiscalYears }),
    },
    deleteEntry: {
      ...deleteEntry,
      mutate: (id: string, opts?: MutateOptions) => deleteEntry.mutate({ params: { id } }, opts),
      mutateAsync: (id: string) => deleteEntry.mutateAsync({ params: { id } }),
    },
    restoreEntry: {
      ...restoreEntry,
      mutate: (id: string, opts?: MutateOptions) => restoreEntry.mutate({ params: { id } }, opts),
      mutateAsync: (id: string) => restoreEntry.mutateAsync({ params: { id } }),
    },
    bulkDeleteEntries: {
      ...bulkDeleteEntries,
      mutate: (ids: string[], opts?: MutateOptions) => bulkDeleteEntries.mutate({ body: { ids } }, opts),
      mutateAsync: (ids: string[]) => bulkDeleteEntries.mutateAsync({ body: { ids } }),
    },
    bulkRestoreEntries: {
      ...bulkRestoreEntries,
      mutate: (ids: string[], opts?: MutateOptions) => bulkRestoreEntries.mutate({ body: { ids } }, opts),
      mutateAsync: (ids: string[]) => bulkRestoreEntries.mutateAsync({ body: { ids } }),
    },
  };
}

export function useAccountingReportAggregates(
  options?: AccountingReportQuery & {
    enabled?: boolean;
  },
) {
  const { isAuthenticated } = useAuth();
  const enabled = (options?.enabled ?? true) && isAuthenticated;
  const params = new URLSearchParams();
  if (options?.dateFrom) params.set('dateFrom', options.dateFrom);
  if (options?.dateTo) params.set('dateTo', options.dateTo);
  const qs = params.toString();
  const url = `${ACCOUNTING_MODULE_MANIFEST.restBasePath}/report-aggregates${qs ? `?${qs}` : ''}`;

  return useQuery({
    queryKey: [...ACCOUNTING_REPORT_AGGREGATES_QUERY_KEY, options?.dateFrom, options?.dateTo] as const,
    queryFn: async ({ signal }): Promise<AccountingReportAggregates> => {
      const res = await apiJson<AccountingReportAggregates>(url, { signal });
      return res;
    },
    enabled,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * General Entries quick-action mutation (Fee, Salary) — bridges Finance and
 * Accounting in one backend transaction, so both modules' cached data are
 * invalidated on success.
 */
export function useProcessSpecializedEntryMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: SpecializedEntryInput) =>
      apiJson<SpecializedEntryResult>(`${ACCOUNTING_MODULE_MANIFEST.restBasePath}/specialized-entries`, {
        method: 'POST',
        body: JSON.stringify(input),
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [ACCOUNTING_MODULE_MANIFEST.moduleId] });
      void queryClient.invalidateQueries({ queryKey: [FINANCE_MODULE_MANIFEST.moduleId] });
    },
  });
}

export function useAccountingMetrics(options?: { enabled?: boolean }) {
  return useServerMetrics<AccountingCommandMetricsSnapshot>({
    moduleId: ACCOUNTING_MODULE_MANIFEST.moduleId,
    apiPath: ACCOUNTING_MODULE_MANIFEST.restBasePath,
    enabled: options?.enabled,
  });
}
