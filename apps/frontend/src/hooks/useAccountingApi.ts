import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  AccountingCommandMetricsSnapshot,
  ModuleColumnPref,
  Account,
  JournalEntry,
  FiscalYear,
} from '@mms/shared';
import { ACCOUNTING_MODULE_CONTRACT } from '@mms/shared';
import { useAuth } from '@/lib/contexts/AuthContext';
import { apiJson } from '@/lib/apiClient';
import { getCollection, saveCollection } from '@/lib/db';
import { useLiveCollection } from '@/hooks/useLiveCollection';

const ACCOUNTING_API = ACCOUNTING_MODULE_CONTRACT.restBasePath;

export const ACCOUNTING_METRICS_QUERY_KEY = [ACCOUNTING_MODULE_CONTRACT.moduleId, 'metrics'] as const;

export const ACCOUNTING_JOURNAL_COLUMN_PREFS_QUERY_KEY = [
  ACCOUNTING_MODULE_CONTRACT.moduleId,
  'journal',
  'column-prefs',
 ] as const;

export const ACCOUNTING_ACCOUNT_COLUMN_PREFS_QUERY_KEY = [
  ACCOUNTING_MODULE_CONTRACT.moduleId,
  'accounts',
  'column-prefs',
] as const;

export const ACCOUNTING_ACCOUNTS_QUERY_KEY = [ACCOUNTING_MODULE_CONTRACT.moduleId, 'accounts', 'list'] as const;
export const ACCOUNTING_ENTRIES_QUERY_KEY = [ACCOUNTING_MODULE_CONTRACT.moduleId, 'entries', 'list'] as const;
export const ACCOUNTING_FISCAL_YEARS_QUERY_KEY = [ACCOUNTING_MODULE_CONTRACT.moduleId, 'fiscal_years', 'list'] as const;

async function fetchAccounts(): Promise<Account[]> {
  const body = await apiJson<{ accounts: Account[] }>(`${ACCOUNTING_API}/accounts`);
  saveCollection('accounting_accounts', body.accounts);
  return getCollection<Account>('accounting_accounts', []);
}

export function useAccountingAccounts(options?: { enabled?: boolean }) {
  const queryEnabled = options?.enabled ?? true;
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: ACCOUNTING_ACCOUNTS_QUERY_KEY,
    queryFn: fetchAccounts,
    enabled: isAuthenticated && queryEnabled,
    staleTime: 30_000,
  });
}

export function useAccountingAccountsCollection(options?: { enabled?: boolean }): Account[] {
  const enabled = options?.enabled ?? true;
  const { data: fromQuery = [] } = useAccountingAccounts({ enabled });
  const fromLocal = useLiveCollection<Account>('accounting_accounts', [], { enabled });
  if (!enabled) return [];
  if (fromQuery.length > 0) {
    return fromQuery;
  }
  return fromLocal;
}

async function fetchEntries(): Promise<JournalEntry[]> {
  const body = await apiJson<{ entries: JournalEntry[] }>(`${ACCOUNTING_API}/entries`);
  saveCollection('accounting_entries', body.entries);
  return getCollection<JournalEntry>('accounting_entries', []);
}

export function useAccountingEntries(options?: { enabled?: boolean }) {
  const queryEnabled = options?.enabled ?? true;
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: ACCOUNTING_ENTRIES_QUERY_KEY,
    queryFn: fetchEntries,
    enabled: isAuthenticated && queryEnabled,
    staleTime: 30_000,
  });
}

export function useAccountingEntriesCollection(options?: { enabled?: boolean }): JournalEntry[] {
  const enabled = options?.enabled ?? true;
  const { data: fromQuery = [] } = useAccountingEntries({ enabled });
  const fromLocal = useLiveCollection<JournalEntry>('accounting_entries', [], { enabled });
  if (!enabled) return [];
  if (fromQuery.length > 0) {
    return fromQuery;
  }
  return fromLocal;
}

async function fetchFiscalYears(): Promise<FiscalYear[]> {
  const body = await apiJson<{ fiscalYears: FiscalYear[] }>(`${ACCOUNTING_API}/fiscal-years`);
  saveCollection('accounting_fiscal_years', body.fiscalYears);
  return getCollection<FiscalYear>('accounting_fiscal_years', []);
}

export function useAccountingFiscalYears(options?: { enabled?: boolean }) {
  const queryEnabled = options?.enabled ?? true;
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: ACCOUNTING_FISCAL_YEARS_QUERY_KEY,
    queryFn: fetchFiscalYears,
    enabled: isAuthenticated && queryEnabled,
    staleTime: 30_000,
  });
}

export function useAccountingFiscalYearsCollection(options?: { enabled?: boolean }): FiscalYear[] {
  const enabled = options?.enabled ?? true;
  const { data: fromQuery = [] } = useAccountingFiscalYears({ enabled });
  const fromLocal = useLiveCollection<FiscalYear>('accounting_fiscal_years', [], { enabled });
  if (!enabled) return [];
  if (fromQuery.length > 0) {
    return fromQuery;
  }
  return fromLocal;
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
    onSuccess: (data) => {
      saveCollection('accounting_accounts', data.accounts);
      invalidate();
    },
  });

  const replaceEntries = useMutation({
    mutationFn: async (entries: JournalEntry[]) =>
      apiJson<{ entries: JournalEntry[] }>(`${ACCOUNTING_API}/entries/bulk`, {
        method: 'PUT',
        body: JSON.stringify(entries),
      }),
    onSuccess: (data) => {
      saveCollection('accounting_entries', data.entries);
      invalidate();
    },
  });

  const replaceFiscalYears = useMutation({
    mutationFn: async (fiscalYears: FiscalYear[]) =>
      apiJson<{ fiscalYears: FiscalYear[] }>(`${ACCOUNTING_API}/fiscal-years/bulk`, {
        method: 'PUT',
        body: JSON.stringify(fiscalYears),
      }),
    onSuccess: (data) => {
      saveCollection('accounting_fiscal_years', data.fiscalYears);
      invalidate();
    },
  });

  return { replaceAccounts, replaceEntries, replaceFiscalYears };
}

export function useAccountingMetrics() {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: ACCOUNTING_METRICS_QUERY_KEY,
    queryFn: async () => {
      const body = await apiJson<{ metrics: AccountingCommandMetricsSnapshot }>(`${ACCOUNTING_API}/metrics`);
      return body.metrics;
    },
    enabled: isAuthenticated,
    staleTime: 30_000,
  });
}

export function useAccountingJournalColumnPrefs() {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: ACCOUNTING_JOURNAL_COLUMN_PREFS_QUERY_KEY,
    queryFn: async () => {
      const body = await apiJson<{ prefs: ModuleColumnPref[] }>(`${ACCOUNTING_API}/journal/column-prefs`);
      return body.prefs;
    },
    enabled: isAuthenticated,
    staleTime: 60_000,
  });
}

export function useAccountingJournalColumnPrefsMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (prefs: ModuleColumnPref[]) =>
      apiJson<{ success: boolean; prefs: ModuleColumnPref[] }>(`${ACCOUNTING_API}/journal/column-prefs`, {
        method: 'PUT',
        body: JSON.stringify({ prefs }),
      }),
    onSuccess: (data) => {
      queryClient.setQueryData(ACCOUNTING_JOURNAL_COLUMN_PREFS_QUERY_KEY, data.prefs);
    },
  });
}

export function useAccountingAccountColumnPrefs() {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: ACCOUNTING_ACCOUNT_COLUMN_PREFS_QUERY_KEY,
    queryFn: async () => {
      const body = await apiJson<{ prefs: ModuleColumnPref[] }>(`${ACCOUNTING_API}/accounts/column-prefs`);
      return body.prefs;
    },
    enabled: isAuthenticated,
    staleTime: 60_000,
  });
}

export function useAccountingAccountColumnPrefsMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (prefs: ModuleColumnPref[]) =>
      apiJson<{ success: boolean; prefs: ModuleColumnPref[] }>(`${ACCOUNTING_API}/accounts/column-prefs`, {
        method: 'PUT',
        body: JSON.stringify({ prefs }),
      }),
    onSuccess: (data) => {
      queryClient.setQueryData(ACCOUNTING_ACCOUNT_COLUMN_PREFS_QUERY_KEY, data.prefs);
    },
  });
}
