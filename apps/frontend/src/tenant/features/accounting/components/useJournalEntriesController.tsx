import { useEffect, useMemo, useState } from 'react';
import type { JournalEntry } from '@/lib/data/accountingData';
import { useTranslation } from '@/hooks/useTranslation';
import { notify } from '@/lib/notify';
import { useAccountingCurrency } from '@/hooks/useCurrency';
import type { JournalEntriesProps } from '@/tenant/features/accounting/components/journalEntriesTypes';
import {
  buildJournalModeTabs,
  buildJournalStatusConfig,
  buildJournalSubTabs,
} from '@/tenant/features/accounting/components/journalEntriesControllerConfig';
import {
  computeJournalGrandTotals,
  filterJournalEntries,
} from '@/tenant/features/accounting/components/journalEntriesControllerFilters';
import {
  createJournalPostHandler,
  createJournalSaveHandler,
  exportJournalEntriesCsv,
  formatJournalAmount,
  reverseJournalEntry,
} from '@/tenant/features/accounting/components/journalEntriesControllerActions';
import {
  createJournalEntryActionsRenderer,
  createJournalNlHandlers,
} from '@/tenant/features/accounting/components/journalEntriesControllerSelection';
import { useJournalEntrySelection } from '@/tenant/features/accounting/hooks/useJournalEntrySelection';
import { DIRECTORY_CARD_OVERFLOW_TRIGGER_CLASS } from '@/components/ui/directoryCardChrome';
import { MODULE_ROW_ACTIONS_TRIGGER_CLASS } from '@/components/ui/ModuleRowActionsMenu';
import type { QuickActionType } from '@/tenant/features/accounting/components/journalEntriesQuickActions';

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
}: JournalEntriesProps) {
  const { t } = useTranslation();
  const { formatCurrency } = useAccountingCurrency();
  const journalStatusConfig = useMemo(() => buildJournalStatusConfig(t), [t]);
  const journalSubTabs = useMemo(() => buildJournalSubTabs(t), [t]);
  const modeTabs = useMemo(() => buildJournalModeTabs(t), [t]);

  const [mode, setMode] = useState<'simple' | 'advanced'>('simple');
  const [tab, setTab] = useState<'transactions' | 'cashbook'>('transactions');
  const [simpleModal, setSimpleModal] = useState<{ prefillType: QuickActionType | null } | null>(null);
  const [nlInput, setNlInput] = useState('');
  const [nlSuggestion, setNlSuggestion] = useState<QuickActionType | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [tagFilter, setTagFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [modal, setModal] = useState<'new' | 'edit' | 'view' | null>(null);
  const [selected, setSelected] = useState<JournalEntry | null>(null);
  const [pendingTrashId, setPendingTrashId] = useState<string | null>(null);
  const [confirmBulkOpen, setConfirmBulkOpen] = useState(false);
  const [pendingReverseEntry, setPendingReverseEntry] = useState<JournalEntry | null>(null);

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

  const filtered = useMemo(
    () => filterJournalEntries(entries, { search, statusFilter, tagFilter, dateFrom, dateTo }),
    [entries, search, statusFilter, tagFilter, dateFrom, dateTo],
  );

  useEffect(() => {
    onFilteredCountChange?.(filtered.length);
  }, [filtered.length, onFilteredCountChange]);

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

  useEffect(() => {
    clearSelection();
  }, [showDeleted, clearSelection]);

  const exportCSV = () => exportJournalEntriesCsv(filtered, t);

  const { handleNlSubmit, handleNlChange } = createJournalNlHandlers(
    nlInput,
    setNlInput,
    setNlSuggestion,
    setSimpleModal,
  );

  const { grandDebit, grandCredit } = useMemo(() => computeJournalGrandTotals(filtered), [filtered]);

  const requestRowTrash = (id: string) => {
    if (showDeleted) {
      void onRestore?.(id);
      return;
    }
    const entry = entries.find((journalEntry) => journalEntry.id === id);
    if (entry?.status === 'posted') {
      notify.warning(t('accounting.journal.alerts.cannotDeletePosted'));
      return;
    }
    setPendingTrashId(id);
  };

  const confirmRowTrash = (): void => {
    if (!pendingTrashId) return;
    void onDelete?.(pendingTrashId);
    setPendingTrashId(null);
  };

  const requestBulkTrash = () => {
    if (showDeleted) {
      void onBulkRestore?.(selectedIds);
      setSelectedIds([]);
      return;
    }
    setConfirmBulkOpen(true);
  };

  const confirmBulkTrash = (): void => {
    if (showDeleted) void onBulkRestore?.(selectedIds);
    else void onBulkDelete?.(selectedIds);
    setSelectedIds([]);
    setConfirmBulkOpen(false);
  };

  const requestReverse = (entry: JournalEntry) => {
    setPendingReverseEntry(entry);
  };

  const confirmReverse = (): void => {
    if (!pendingReverseEntry) return;
    void reverseJournalEntry(pendingReverseEntry, entries, onChange);
    setPendingReverseEntry(null);
  };

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
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    tagFilter,
    setTagFilter,
    dateFrom,
    setDateFrom,
    dateTo,
    setDateTo,
    showFilters,
    setShowFilters,
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
