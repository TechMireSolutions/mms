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
import { readModuleColumnPreferences, writeModuleColumnPreferences, type ModuleColumnPreferencesResponse } from '@/lib/moduleColumnPreferencesApi';

const ACCOUNTING_API = ACCOUNTING_MODULE_CONTRACT.restBasePath;

export const ACCOUNTING_METRICS_QUERY_KEY = [ACCOUNTING_MODULE_CONTRACT.moduleId, 'metrics'] as const;

export const ACCOUNTING_JOURNAL_COLUMN_PREFS_QUERY_KEY = [
  ACCOUNTING_MODULE_CONTRACT.moduleId,
  'journal',
  'column-preferences',
 ] as const;

export const ACCOUNTING_ACCOUNT_COLUMN_PREFS_QUERY_KEY = [
  ACCOUNTING_MODULE_CONTRACT.moduleId,
  'accounts',
  'column-preferences',
] as const;

export const ACCOUNTING_ACCOUNTS_QUERY_KEY = [ACCOUNTING_MODULE_CONTRACT.moduleId, 'accounts', 'list'] as const;
export const ACCOUNTING_ENTRIES_QUERY_KEY = [ACCOUNTING_MODULE_CONTRACT.moduleId, 'entries', 'list'] as const;
export const ACCOUNTING_FISCAL_YEARS_QUERY_KEY = [ACCOUNTING_MODULE_CONTRACT.moduleId, 'fiscal_years', 'list'] as const;

async function fetchAccounts(): Promise<Account[]> {
  const accountsResponse = await apiJson<{ accounts: Account[] }>(`${ACCOUNTING_API}/accounts`);
  saveCollection('accounting_accounts', accountsResponse.accounts);
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
  const { data: queryAccounts = [] } = useAccountingAccounts({ enabled });
  const localAccounts = useLiveCollection<Account>('accounting_accounts', [], { enabled });
  if (!enabled) return [];
  if (queryAccounts.length > 0) {
    return queryAccounts;
  }
  return localAccounts;
}

async function fetchEntries(): Promise<JournalEntry[]> {
  const entriesResponse = await apiJson<{ entries: JournalEntry[] }>(`${ACCOUNTING_API}/entries`);
  saveCollection('accounting_entries', entriesResponse.entries);
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
  const { data: queryEntries = [] } = useAccountingEntries({ enabled });
  const localEntries = useLiveCollection<JournalEntry>('accounting_entries', [], { enabled });
  if (!enabled) return [];
  if (queryEntries.length > 0) {
    return queryEntries;
  }
  return localEntries;
}

async function fetchFiscalYears(): Promise<FiscalYear[]> {
  const fiscalYearsResponse = await apiJson<{ fiscalYears: FiscalYear[] }>(`${ACCOUNTING_API}/fiscal-years`);
  saveCollection('accounting_fiscal_years', fiscalYearsResponse.fiscalYears);
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
  const { data: queryFiscalYears = [] } = useAccountingFiscalYears({ enabled });
  const localFiscalYears = useLiveCollection<FiscalYear>('accounting_fiscal_years', [], { enabled });
  if (!enabled) return [];
  if (queryFiscalYears.length > 0) {
    return queryFiscalYears;
  }
  return localFiscalYears;
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

  return { replaceAccounts, replaceEntries, replaceFiscalYears };
}

export function useAccountingMetrics() {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: ACCOUNTING_METRICS_QUERY_KEY,
    queryFn: async () => {
      const metricsResponse = await apiJson<{ metrics: AccountingCommandMetricsSnapshot }>(`${ACCOUNTING_API}/metrics`);
      return metricsResponse.metrics;
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
      const preferencesResponse = await apiJson<ModuleColumnPreferencesResponse>(`${ACCOUNTING_API}/journal/column-preferences`);
      return readModuleColumnPreferences(preferencesResponse);
    },
    enabled: isAuthenticated,
    staleTime: 60_000,
  });
}

export function useAccountingJournalColumnPrefsMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (preferences: ModuleColumnPref[]) =>
      apiJson<ModuleColumnPreferencesResponse>(`${ACCOUNTING_API}/journal/column-preferences`, {
        method: 'PUT',
        body: writeModuleColumnPreferences(preferences),
      }),
    onSuccess: (preferencesResponse) => {
      queryClient.setQueryData(ACCOUNTING_JOURNAL_COLUMN_PREFS_QUERY_KEY, readModuleColumnPreferences(preferencesResponse));
    },
  });
}

export function useAccountingAccountColumnPrefs() {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: ACCOUNTING_ACCOUNT_COLUMN_PREFS_QUERY_KEY,
    queryFn: async () => {
      const preferencesResponse = await apiJson<ModuleColumnPreferencesResponse>(`${ACCOUNTING_API}/accounts/column-preferences`);
      return readModuleColumnPreferences(preferencesResponse);
    },
    enabled: isAuthenticated,
    staleTime: 60_000,
  });
}

export function useAccountingAccountColumnPrefsMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (preferences: ModuleColumnPref[]) =>
      apiJson<ModuleColumnPreferencesResponse>(`${ACCOUNTING_API}/accounts/column-preferences`, {
        method: 'PUT',
        body: writeModuleColumnPreferences(preferences),
      }),
    onSuccess: (preferencesResponse) => {
      queryClient.setQueryData(ACCOUNTING_ACCOUNT_COLUMN_PREFS_QUERY_KEY, readModuleColumnPreferences(preferencesResponse));
    },
  });
}
