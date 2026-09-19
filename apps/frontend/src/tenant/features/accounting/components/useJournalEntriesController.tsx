import { useEffect, useRef, useState } from 'react';
import type { JournalEntry } from '@/lib/data/accountingData';
import { useTranslation } from '@/hooks/useTranslation';
import { useAccountingCurrency } from '@/hooks/useCurrency';
import type { JournalEntriesProps } from '@/tenant/features/accounting/components/journalEntriesTypes';
import {
  buildJournalModeTabs,
  buildJournalStatusConfig,
  buildJournalSubTabs,
} from '@/tenant/features/accounting/components/journalEntriesControllerConfig';
import {
  computeJournalGrandTotals,
  type JournalEntriesServerQueryProps,
} from '@/tenant/features/accounting/components/journalEntriesControllerFilters';
import {
  createJournalPostHandler,
  createJournalSaveHandler,
  exportJournalEntriesCsv,
  formatJournalAmount,
} from '@/tenant/features/accounting/components/journalEntriesControllerActions';
import { useJournalEntriesTrashReversal } from '@/tenant/features/accounting/components/useJournalEntriesTrashReversal';
import {
  createJournalEntryActionsRenderer,
  createJournalNlHandlers,
} from '@/tenant/features/accounting/components/journalEntriesControllerSelection';
import { useJournalEntrySelection } from '@/tenant/features/accounting/hooks/useJournalEntrySelection';
import { DIRECTORY_CARD_OVERFLOW_TRIGGER_CLASS } from '@/components/ui/directoryCardChrome';
import { MODULE_ROW_ACTIONS_TRIGGER_CLASS } from '@/components/ui/ModuleRowActionsMenu';
import type { QuickActionType } from '@/tenant/features/accounting/components/journalEntriesQuickActions';

type JournalEntriesControllerProps = JournalEntriesProps & JournalEntriesServerQueryProps;

export function useJournalEntriesController({
  entries,
  accounts: _accounts,
  settings: __settings,
  fiscalYears: _fiscalYears,
  onChange,
  onFilteredCountChange,
  canWrite = true,
  canDelete = true,
  showDeleted = false,
  createRequestKey = 0,
  onDelete,
  onRestore,
  onBulkDelete,
  onBulkRestore,
  filters,
  onFiltersChange,
  paging,
}: JournalEntriesControllerProps) {
  const { t } = useTranslation();
  const { formatCurrency } = useAccountingCurrency();
  const journalStatusConfig = (() => buildJournalStatusConfig(t))();
  const journalSubTabs = (() => buildJournalSubTabs(t))();
  const modeTabs = (() => buildJournalModeTabs(t))();

  const [mode, setMode] = useState<'simple' | 'advanced'>('simple');
  const [tab, setTab] = useState<'transactions' | 'cashbook'>('transactions');
  const [simpleModal, setSimpleModal] = useState<{
    prefillType: QuickActionType | null;
    initialAmount?: string;
    initialDescription?: string;
  } | null>(null);
  const [nlInput, setNlInput] = useState('');
  const [nlSuggestion, setNlSuggestion] = useState<QuickActionType | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [modal, setModal] = useState<'new' | 'edit' | 'view' | null>(null);
  const [selected, setSelected] = useState<JournalEntry | null>(null);

  useEffect(() => {
    if (showDeleted) setMode('advanced');
  }, [showDeleted]);

  useEffect(() => {
    if (createRequestKey > 0 && canWrite && !showDeleted) {
      setMode('advanced');
      setModal('new');
      setSelected(null);
    }
  }, [createRequestKey, canWrite, showDeleted]);

  /**
   * `entries` is already the page the server filtered and ordered for the active
   * filters — a second, client-side filter pass here would only narrow that page
   * and report "no results" while matching entries sit on another page.
   */
  const filtered = entries;

  // The metric is the server's total for the active filter, so page 2 does not
  // report 100 rows as if that were the result size.
  useEffect(() => {
    onFilteredCountChange?.(paging.total);
  }, [paging.total, onFilteredCountChange]);

  const actionDeps = {
    entries,
    showDeleted,
    t,
    onChange,
    onDelete,
    onRestore,
    onBulkDelete,
    onBulkRestore,
    setModal,
    setSelected,
    setSimpleModal,
  };

  const handleSave = createJournalSaveHandler(actionDeps);
  const handlePost = createJournalPostHandler(actionDeps);

  const {
    selectedIds,
    setSelectedIds,
    allVisibleSelected,
    someVisibleSelected,
    toggleSelectAll,
    toggleSelectedEntry,
    clearSelection,
  } = useJournalEntrySelection(filtered);

  const wasShowDeletedRef = useRef(showDeleted);
  useEffect(() => {
    if (wasShowDeletedRef.current !== showDeleted) {
      wasShowDeletedRef.current = showDeleted;
      clearSelection();
    }
  }, [showDeleted, clearSelection]);

  const exportCSV = () => exportJournalEntriesCsv(filtered, t);

  const { handleNlSubmit, handleNlChange } = createJournalNlHandlers(
    nlInput,
    setNlInput,
    setNlSuggestion,
    setSimpleModal,
  );

  const { grandDebit, grandCredit } = (() => computeJournalGrandTotals(filtered))();

  const {
    pendingTrashId,
    setPendingTrashId,
    requestRowTrash,
    confirmRowTrash,
    confirmBulkOpen,
    setConfirmBulkOpen,
    requestBulkTrash,
    confirmBulkTrash,
    pendingReverseEntry,
    setPendingReverseEntry,
    requestReverse,
    confirmReverse,
  } = useJournalEntriesTrashReversal({
    entries,
    showDeleted,
    selectedIds,
    setSelectedIds,
    onDelete,
    onRestore,
    onBulkDelete,
    onBulkRestore,
    onChange,
    t,
  });

  const renderEntryActions = createJournalEntryActionsRenderer(
    {
      canWrite,
      canDelete,
      showDeleted,
      setSelected,
      setModal,
      handlePost,
      requestRowTrash,
      handleReverse: requestReverse,
    },
    { triggerClassName: MODULE_ROW_ACTIONS_TRIGGER_CLASS },
  );

  const renderEntryActionsCards = createJournalEntryActionsRenderer(
    {
      canWrite,
      canDelete,
      showDeleted,
      setSelected,
      setModal,
      handlePost,
      requestRowTrash,
      handleReverse: requestReverse,
    },
    { triggerClassName: DIRECTORY_CARD_OVERFLOW_TRIGGER_CLASS, hideViewItem: true },
  );

  return {
    mode,
    setMode,
    tab,
    setTab,
    modeTabs,
    journalSubTabs,
    journalStatusConfig,
    simpleModal,
    setSimpleModal,
    nlInput,
    nlSuggestion,
    filtered,
    selectedIds,
    clearSelection,
    allVisibleSelected,
    someVisibleSelected,
    grandDebit,
    grandCredit,
    search: filters.search,
    setSearch: (value: string) => onFiltersChange({ search: value }),
    statusFilter: filters.statusFilter,
    setStatusFilter: (value: string) => onFiltersChange({ statusFilter: value }),
    tagFilter: filters.tagFilter,
    setTagFilter: (value: string) => onFiltersChange({ tagFilter: value }),
    dateFrom: filters.dateFrom,
    setDateFrom: (value: string) => onFiltersChange({ dateFrom: value }),
    dateTo: filters.dateTo,
    setDateTo: (value: string) => onFiltersChange({ dateTo: value }),
    showFilters,
    setShowFilters,
    paging,
    modal,
    selected,
    setSelected,
    setModal,
    canWrite,
    canDelete,
    showDeleted,
    handleSave,
    exportCSV,
    handleNlSubmit,
    handleNlChange,
    toggleSelectedEntry,
    toggleSelectAll,
    renderEntryActions,
    renderEntryActionsCards,
    formatAmount: (amount: number) => formatJournalAmount(amount, formatCurrency),
    requestRowTrash,
    confirmRowTrash,
    requestBulkTrash,
    confirmBulkTrash,
    requestReverse,
    confirmReverse,
    pendingTrashId,
    setPendingTrashId,
    confirmBulkOpen,
    setConfirmBulkOpen,
    pendingReverseEntry,
    setPendingReverseEntry,
  };
}
