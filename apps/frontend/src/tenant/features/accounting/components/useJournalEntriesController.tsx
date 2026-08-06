import { useEffect, useMemo, useState } from 'react';
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
  filterJournalEntries,
} from '@/tenant/features/accounting/components/journalEntriesControllerFilters';
import {
  createJournalBulkActionHandler,
  createJournalDeleteHandler,
  createJournalPostHandler,
  createJournalReverseHandler,
  createJournalSaveHandler,
  exportJournalEntriesCsv,
  formatJournalAmount,
} from '@/tenant/features/accounting/components/journalEntriesControllerActions';
import {
  createJournalEntryActionsRenderer,
  createJournalNlHandlers,
  createJournalSelectionHandlers,
} from '@/tenant/features/accounting/components/journalEntriesControllerSelection';
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
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

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

  useEffect(() => {
    setSelectedIds([]);
  }, [showDeleted]);

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
    setSelectedIds,
  };

  const handleSave = createJournalSaveHandler(actionDeps);
  const handleDelete = createJournalDeleteHandler(actionDeps);
  const handlePost = createJournalPostHandler(actionDeps);
  const handleReverse = createJournalReverseHandler(actionDeps);
  const handleBulkAction = createJournalBulkActionHandler(actionDeps, selectedIds);

  const { toggleSelected, toggleAllFiltered, allFilteredSelected } = createJournalSelectionHandlers(
    filtered,
    selectedIds,
    setSelectedIds,
  );

  const exportCSV = () => exportJournalEntriesCsv(filtered, t);

  const { handleNlSubmit, handleNlChange } = createJournalNlHandlers(
    nlInput,
    setNlInput,
    setNlSuggestion,
    setSimpleModal,
  );

  const { grandDebit, grandCredit } = useMemo(() => computeJournalGrandTotals(filtered), [filtered]);

  const renderEntryActions = createJournalEntryActionsRenderer({
    canWrite,
    canDelete,
    showDeleted,
    setSelected,
    setModal,
    handlePost,
    handleDelete,
    handleReverse,
  });

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
    clearSelection: () => setSelectedIds([]),
    allFilteredSelected,
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
    handleBulkAction,
    exportCSV,
    handleNlSubmit,
    handleNlChange,
    toggleSelected,
    toggleAllFiltered,
    renderEntryActions,
    formatAmount: (amount: number) => formatJournalAmount(amount, formatCurrency),
    handleReverse,
  };
}
