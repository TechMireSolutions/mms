import { useMutation, useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import type {
  AccountingCommandMetricsSnapshot,
  AccountingListQuery,
  AccountingAccountsListPageResult,
  AccountingEntriesListPageResult,
  AccountingFiscalYearsListPageResult,
  Account,
  JournalEntry,
  FiscalYear,
} from '@mms/shared';
import { ACCOUNTING_MODULE_MANIFEST } from '@mms/shared';
import { useServerMetrics } from '@/hooks/useServerMetrics';
import { apiJson } from '@/lib/apiClient';
import { NotifiedMutationError } from '@/lib/notifiedMutationError';
import { useAuth } from '@/lib/contexts/AuthContext';

const ACCOUNTING_API = ACCOUNTING_MODULE_MANIFEST.restBasePath;

export const ACCOUNTING_METRICS_QUERY_KEY = [ACCOUNTING_MODULE_MANIFEST.moduleId, 'metrics'] as const;

export const ACCOUNTING_ACCOUNTS_QUERY_KEY = [ACCOUNTING_MODULE_MANIFEST.moduleId, 'accounts', 'list'] as const;
export const ACCOUNTING_ENTRIES_QUERY_KEY = [ACCOUNTING_MODULE_MANIFEST.moduleId, 'entries', 'list'] as const;
export const ACCOUNTING_FISCAL_YEARS_QUERY_KEY = [ACCOUNTING_MODULE_MANIFEST.moduleId, 'fiscal_years', 'list'] as const;

/** @deprecated Prefer NotifiedMutationError — kept for form catch compatibility. */
export class NotifiedAccountingMutationError extends NotifiedMutationError {}

export function useAccountingAccountsPaginated(query: AccountingListQuery, options?: { enabled?: boolean }) {
  const { isAuthenticated } = useAuth();
  const enabled = (options?.enabled ?? true) && isAuthenticated;
  
  const queryParams = new URLSearchParams();
  if (query.page) queryParams.set('page', String(query.page));
  if (query.limit) queryParams.set('limit', String(query.limit));
  if (query.search) queryParams.set('search', query.search);
  if (query.sortField) queryParams.set('sortField', query.sortField);
  if (query.sortDir) queryParams.set('sortDir', query.sortDir);
  if (query.includeDeleted) queryParams.set('includeDeleted', 'true');
  
  const queryString = queryParams.toString();

  return useQuery({
    queryKey: [...ACCOUNTING_ACCOUNTS_QUERY_KEY, query],
    queryFn: async ({ signal }): Promise<AccountingAccountsListPageResult> =>
      apiJson<AccountingAccountsListPageResult>(
        `${ACCOUNTING_API}/accounts${queryString ? `?${queryString}` : ''}`,
        { signal },
      ),
    enabled,
    placeholderData: keepPreviousData,
  });
}

export function useAccountingEntriesPaginated(query: AccountingListQuery, options?: { enabled?: boolean }) {
  const { isAuthenticated } = useAuth();
  const enabled = (options?.enabled ?? true) && isAuthenticated;
  
  const queryParams = new URLSearchParams();
  if (query.page) queryParams.set('page', String(query.page));
  if (query.limit) queryParams.set('limit', String(query.limit));
  if (query.search) queryParams.set('search', query.search);
  if (query.sortField) queryParams.set('sortField', query.sortField);
  if (query.sortDir) queryParams.set('sortDir', query.sortDir);
  if (query.includeDeleted) queryParams.set('includeDeleted', 'true');
  
  const queryString = queryParams.toString();

  return useQuery({
    queryKey: [...ACCOUNTING_ENTRIES_QUERY_KEY, query],
    queryFn: async ({ signal }): Promise<AccountingEntriesListPageResult> =>
      apiJson<AccountingEntriesListPageResult>(
        `${ACCOUNTING_API}/entries${queryString ? `?${queryString}` : ''}`,
        { signal },
      ),
    enabled,
    placeholderData: keepPreviousData,
  });
}

export function useAccountingFiscalYearsPaginated(query: AccountingListQuery, options?: { enabled?: boolean }) {
  const { isAuthenticated } = useAuth();
  const enabled = (options?.enabled ?? true) && isAuthenticated;
  
  const queryParams = new URLSearchParams();
  if (query.page) queryParams.set('page', String(query.page));
  if (query.limit) queryParams.set('limit', String(query.limit));
  if (query.search) queryParams.set('search', query.search);
  if (query.sortField) queryParams.set('sortField', query.sortField);
  if (query.sortDir) queryParams.set('sortDir', query.sortDir);
  if (query.includeDeleted) queryParams.set('includeDeleted', 'true');
  
  const queryString = queryParams.toString();

  return useQuery({
    queryKey: [...ACCOUNTING_FISCAL_YEARS_QUERY_KEY, query],
    queryFn: async ({ signal }): Promise<AccountingFiscalYearsListPageResult> =>
      apiJson<AccountingFiscalYearsListPageResult>(
        `${ACCOUNTING_API}/fiscal-years${queryString ? `?${queryString}` : ''}`,
        { signal },
      ),
    enabled,
    placeholderData: keepPreviousData,
  });
}

/** @deprecated Use useAccountingAccountsPaginated instead */
export function useAccountingAccountsCollection(options?: { enabled?: boolean; includeDeleted?: boolean }): Account[] {
  const query = useAccountingAccountsPaginated({ page: 1, limit: 500, includeDeleted: options?.includeDeleted }, options);
  return query.data?.accounts ?? [];
}

/** @deprecated Use useAccountingEntriesPaginated instead */
export function useAccountingEntriesCollection(options?: { enabled?: boolean; includeDeleted?: boolean }): JournalEntry[] {
  const query = useAccountingEntriesPaginated({ page: 1, limit: 500, includeDeleted: options?.includeDeleted }, options);
  return query.data?.entries ?? [];
}

/** @deprecated Use useAccountingFiscalYearsPaginated instead */
export function useAccountingFiscalYearsCollection(options?: { enabled?: boolean }): FiscalYear[] {
  const query = useAccountingFiscalYearsPaginated({ page: 1, limit: 500 }, options);
  return query.data?.fiscalYears ?? [];
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
    onSuccess: () => {
      invalidate();
    },
  });

  const replaceEntries = useMutation({
    mutationFn: async (entries: JournalEntry[]) =>
      apiJson<{ entries: JournalEntry[] }>(`${ACCOUNTING_API}/entries/bulk`, {
        method: 'PUT',
        body: JSON.stringify(entries),
      }),
    onSuccess: () => {
      invalidate();
    },
  });

  const replaceFiscalYears = useMutation({
    mutationFn: async (fiscalYears: FiscalYear[]) =>
      apiJson<{ fiscalYears: FiscalYear[] }>(`${ACCOUNTING_API}/fiscal-years/bulk`, {
        method: 'PUT',
        body: JSON.stringify(fiscalYears),
      }),
    onSuccess: () => {
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
