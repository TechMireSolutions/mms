import { useEffect, useMemo, useState } from 'react';
import { usePersistedTabState } from '@/hooks/usePersistedTabState';
import { useModuleShortcuts } from '@/hooks/useModuleShortcuts';
import { useTranslation } from '@/hooks/useTranslation';
import { useFilteredModuleTierTabs } from '@/tenant/hooks/useModuleTierTabs';
import { useModulePermissions } from '@/tenant/hooks/usePermissions';
import { useAccountingJournalColumnLayout } from '@/tenant/features/accounting/hooks/useAccountingJournalColumnLayout';
import { useAccountingAccountColumnLayout } from '@/tenant/features/accounting/hooks/useAccountingAccountColumnLayout';
import { useAccountingConfig } from '@/hooks/useStandardModuleConfig';
import { useAccountingCurrency } from '@/hooks/useCurrency';
import { ACCOUNTING_MODULE_MANIFEST, type FiscalYear } from '@mms/shared';
import {
  useAccountingAccountsPaginated,
  useAccountingEntriesPaginated,
  useAccountingFiscalYearsPaginated,
} from '@/tenant/features/accounting/hooks/useAccountingApi';
import { useAccountingPageActions } from '@/tenant/features/accounting/hooks/useAccountingPageActions';
import { useAccountingDirectoryFilters } from '@/tenant/features/accounting/hooks/useAccountingDirectoryFilters';
import {
  ACCOUNTING_SUB_TAB_ICONS,
  ACCOUNTING_SUB_TAB_IDS,
  ACCOUNTING_SUB_TAB_KEYS,
} from '@/tenant/features/accounting/accountingPageSubTabs';

/** Interim upper bound for overview / ledger / trial / reports client aggregates. */
const ACCOUNTING_AGGREGATE_LIMIT = 500;

export function useAccountingPageController() {
  const { t } = useTranslation();
  const {
    canWrite,
    canDelete,
    canReports: canViewReports,
    canViewSetup,
  } = useModulePermissions(ACCOUNTING_MODULE_MANIFEST);
  const PAGE_TABS = useFilteredModuleTierTabs({ canViewSetup, canViewReports });
  const SUB_TABS = useMemo(
    () => ACCOUNTING_SUB_TAB_IDS.map((subTabId) => ({
      id: subTabId,
      label: t(ACCOUNTING_SUB_TAB_KEYS[subTabId]),
      icon: ACCOUNTING_SUB_TAB_ICONS[subTabId],
    })),
    [t],
  );
  const [activeTab, setActiveTab] = usePersistedTabState<string>('accounting_active_tab', 'work');
  const [activeSubTab, setActiveSubTab] = useState('overview');
  const [createJournalRequestKey, setCreateJournalRequestKey] = useState(0);
  const [filteredCount, setFilteredCount] = useState(0);

  const {
    entryListPage,
    setEntryListPage,
    accountListPage,
    setAccountListPage,
    showDeleted,
    setShowDeleted,
    entrySearch,
    setEntrySearch,
    debouncedEntrySearch,
    entryStatusFilter,
    setEntryStatusFilter,
    entryDateFrom,
    setEntryDateFrom,
    entryDateTo,
    setEntryDateTo,
    accountSearch,
    setAccountSearch,
    debouncedAccountSearch,
    accountTypeFilter,
    setAccountTypeFilter,
  } = useAccountingDirectoryFilters();

  const pageSize = ACCOUNTING_MODULE_MANIFEST.defaultPageSize;
  const journalWork = activeTab === 'work' && activeSubTab === 'journal';
  const coaWork = activeTab === 'work' && activeSubTab === 'coa';
  const needsAggregateEntries =
    activeTab === 'reports'
    || (activeTab === 'work' && (activeSubTab === 'overview' || activeSubTab === 'ledger' || activeSubTab === 'trial'));
  const needsPickerAccounts = journalWork || activeTab === 'setup' || needsAggregateEntries;

  const entriesResult = useAccountingEntriesPaginated({
    page: journalWork ? entryListPage : 1,
    limit: journalWork ? pageSize : ACCOUNTING_AGGREGATE_LIMIT,
    search: journalWork ? (debouncedEntrySearch.trim() || undefined) : undefined,
    status: journalWork && entryStatusFilter !== 'all' ? entryStatusFilter : undefined,
    dateFrom: journalWork ? (entryDateFrom.trim() || undefined) : undefined,
    dateTo: journalWork ? (entryDateTo.trim() || undefined) : undefined,
    includeDeleted: journalWork ? showDeleted : false,
    sortField: journalWork ? 'date' : undefined,
    sortDir: journalWork ? 'desc' : undefined,
  }, { enabled: journalWork || needsAggregateEntries });

  const accountsResult = useAccountingAccountsPaginated({
    page: coaWork ? accountListPage : 1,
    limit: coaWork ? pageSize : ACCOUNTING_AGGREGATE_LIMIT,
    search: coaWork ? (debouncedAccountSearch.trim() || undefined) : undefined,
    accountType: coaWork && accountTypeFilter !== 'all' ? accountTypeFilter : undefined,
    sortField: 'code',
    sortDir: 'asc',
  }, { enabled: coaWork || needsPickerAccounts });

  const fiscalYearsResult = useAccountingFiscalYearsPaginated({ page: 1, limit: 100 });

  const accounts = accountsResult.data?.accounts ?? [];
  const journalEntries = entriesResult.data?.entries ?? [];
  const fiscalYears: FiscalYear[] = fiscalYearsResult.data?.fiscalYears ?? [];
  const entryTotal = entriesResult.data?.total ?? journalEntries.length;
  const accountTotal = accountsResult.data?.total ?? accounts.length;

  const { settings } = useAccountingConfig();
  const { activeCurrency } = useAccountingCurrency();
  const journalColumnLayout = useAccountingJournalColumnLayout();
  const accountColumnLayout = useAccountingAccountColumnLayout();

  const {
    setAccounts,
    setEntries,
    setFiscalYears,
    handleDeleteEntry,
    handleRestoreEntry,
    handleBulkDeleteEntries,
    handleBulkRestoreEntries,
  } = useAccountingPageActions({ accounts, journalEntries, fiscalYears });

  useEffect(() => {
    if (journalWork) {
      setFilteredCount(entryTotal);
      return;
    }
    if (coaWork) {
      setFilteredCount(accountTotal);
      return;
    }
    setFilteredCount(journalEntries.length);
  }, [journalWork, coaWork, entryTotal, accountTotal, journalEntries.length]);

  const openJournalCreate = () => {
    setActiveTab('work');
    setActiveSubTab('journal');
    setCreateJournalRequestKey((key) => key + 1);
  };

  useModuleShortcuts({
    searchInputId: 'accounting-search-input',
    selectedCount: 0,
    hasActiveFilters: false,
    clearFilters: () => {},
    clearSelection: () => {},
    canWrite,
    showDeleted,
    onCreate: openJournalCreate,
    enabled: activeTab === 'work',
  });

  const activeFiscalYear = fiscalYears.find((fiscalYear) => fiscalYear.status === 'active');
  const listLoadFailed = accountsResult.isError || entriesResult.isError;

  return {
    t,
    canWrite,
    canDelete,
    PAGE_TABS,
    SUB_TABS,
    activeTab,
    setActiveTab,
    activeSubTab,
    setActiveSubTab,
    showDeleted,
    setShowDeleted,
    createJournalRequestKey,
    filteredCount,
    setFilteredCount,
    accounts,
    journalEntries,
    fiscalYears,
    entryTotal,
    accountTotal,
    pageSize,
    entryListPage,
    setEntryListPage,
    accountListPage,
    setAccountListPage,
    entrySearch,
    setEntrySearch,
    entryStatusFilter,
    setEntryStatusFilter,
    entryDateFrom,
    setEntryDateFrom,
    entryDateTo,
    setEntryDateTo,
    accountSearch,
    setAccountSearch,
    accountTypeFilter,
    setAccountTypeFilter,
    settings,
    activeCurrency,
    journalColumnLayout,
    accountColumnLayout,
    setAccounts,
    setEntries,
    setFiscalYears,
    handleDeleteEntry,
    handleRestoreEntry,
    handleBulkDeleteEntries,
    handleBulkRestoreEntries,
    openJournalCreate,
    activeFiscalYear,
    listLoadFailed,
    accountsResult,
    entriesResult,
    journalWork,
    coaWork,
  };
}
