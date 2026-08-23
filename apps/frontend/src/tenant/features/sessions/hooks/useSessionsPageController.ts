import { useEffect, useMemo, useState } from 'react';
import { useWorkDirectoryViewMode } from '@/hooks/useWorkDirectoryViewMode';
import { usePersistedTabState } from '@/hooks/usePersistedTabState';
import { useTranslation } from '@/hooks/useTranslation';
import { useFilteredModuleTierTabs } from '@/tenant/hooks/useModuleTierTabs';
import type { SessionSortField } from '@/tenant/features/sessions/components/sessionPageTypes';
import type { Session } from '@/lib/data/sessionsData';
import { useSessionsPaginated, useSessionMutations } from '@/tenant/features/sessions/hooks/useSessions';
import { useSessionDisplayConfig } from '@/tenant/features/sessions/hooks/useSessionDisplayConfig';
import { useSessionColumnLayout } from '@/tenant/features/sessions/hooks/useSessionColumnLayout';
import { useSessionsDirectoryFilters } from '@/tenant/features/sessions/hooks/useSessionsDirectoryFilters';
import { useSessionsKeyboardShortcuts } from '@/tenant/features/sessions/hooks/useSessionsKeyboardShortcuts';
import { useSessionConfig } from '@/hooks/useStandardModuleConfig';
import { useModulePermissions } from '@/tenant/hooks/usePermissions';
import { SESSIONS_MODULE_MANIFEST, type SessionsListPageResult } from '@mms/shared';
import {
  createSessionBulkDeleteHandler,
  createSessionBulkRestoreHandler,
  createSessionBulkStatusHandler,
  createSessionDeleteHandler,
  createSessionRestoreHandler,
  createSessionSaveHandler,
  createSessionUpdateHandler,
} from '@/tenant/features/sessions/hooks/sessionsPageControllerActions';
import {
  defaultSessionsExportColumns,
  useSessionsExportActions,
} from '@/tenant/features/sessions/hooks/useSessionsExportActions';
import { toggleFilterValue, useSessionsSelection } from '@/tenant/features/sessions/hooks/useSessionsSelection';

export function useSessionsPageController() {
  const { canWrite, canDelete, canExport, canReports: canViewReports, canViewSetup } =
    useModulePermissions(SESSIONS_MODULE_MANIFEST);
  const PAGE_TABS = useFilteredModuleTierTabs({ canViewSetup, canViewReports });
  const { t } = useTranslation();
  const {
    createSession,
    updateSession,
    deleteSession,
    restoreSession,
    bulkDeleteSessions,
    bulkRestoreSessions,
    bulkUpdateSessionStatus,
    logExportAudit,
  } = useSessionMutations();
  const { settings, statuses, types } = useSessionConfig();
  const { statusOptions, typeOptions, statusLabels, typeLabels, statusConfig, typeConfig } =
    useSessionDisplayConfig({ statuses, types, t });

  const columnLayout = useSessionColumnLayout();
  const { viewMode, setViewMode } = useWorkDirectoryViewMode();
  const {
    listPage,
    setListPage,
    showDeleted,
    setShowDeleted,
    sortField,
    setSortField,
    sortDir,
    setSortDir,
    search,
    setSearch,
    debouncedSearch,
    filterStatus,
    setFilterStatus,
    filterType,
    setFilterType,
    clearFilters,
    hasActiveFilters,
  } = useSessionsDirectoryFilters();
  const [showForm, setShowForm] = useState(false);
  const [editSession, setEditSession] = useState<Session | null>(null);
  const [detailSession, setDetailSession] = useState<Session | null>(null);
  const [confirmBulkDeleteOpen, setConfirmBulkDeleteOpen] = useState(false);
  const [confirmBulkRestoreOpen, setConfirmBulkRestoreOpen] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = usePersistedTabState<string>('sessions_active_tab', 'work');

  const useServerWork = activeTab === 'work';
  const { data: workPageData, isLoading: isWorkLoading, isFetching: isWorkFetching, isError, refetch } =
    useSessionsPaginated({
      page: listPage,
      limit: SESSIONS_MODULE_MANIFEST.defaultPageSize,
      search: debouncedSearch,
      status: filterStatus.length > 0 ? filterStatus.join(',') : undefined,
      type: filterType.length > 0 ? filterType.join(',') : undefined,
      sortField,
      sortDir,
      includeDeleted: showDeleted,
      enabled: useServerWork,
    });

  const pageData = (workPageData?.body ?? workPageData) as SessionsListPageResult | undefined;

  const sessions = useMemo(
    () => (pageData?.sessions ?? []) as Session[],
    [pageData],
  );

  const {
    selectedIds,
    setSelectedIds,
    allVisibleSelected,
    someVisibleSelected,
    toggleSelectAll,
    toggleSelectedSession,
    clearSelection,
  } = useSessionsSelection(sessions);

  useEffect(() => {
    setSelectedIds([]);
  }, [debouncedSearch, filterStatus, filterType, showDeleted, sortField, sortDir, setSelectedIds]);

  useSessionsKeyboardShortcuts({
    selectedCount: selectedIds.length,
    hasActiveFilters,
    clearFilters,
    clearSelection,
    canWrite,
    showDeleted,
    onCreate: () => {
      setEditSession(null);
      setShowForm(true);
    },
  });

  const shownCount = pageData?.total ?? sessions.length;

  const mutationDeps = {
    t,
    editSession,
    detailSession,
    setDetailSession,
    createSession,
    updateSession,
    deleteSession,
    restoreSession,
    bulkDeleteSessions,
    bulkRestoreSessions,
    selectedIds,
    setSelectedIds,
  };

  const handleSave = createSessionSaveHandler(mutationDeps);
  const handleUpdate = createSessionUpdateHandler(mutationDeps);
  const handleDelete = createSessionDeleteHandler(mutationDeps);
  const handleRestore = createSessionRestoreHandler(mutationDeps);
  const handleBulkDelete = createSessionBulkDeleteHandler(mutationDeps);
  const handleBulkRestore = createSessionBulkRestoreHandler(mutationDeps);
  const handleBulkStatusChange = createSessionBulkStatusHandler({
    t,
    bulkUpdateSessionStatus,
    setSelectedIds,
  });

  const exportColumns = useMemo(
    () => defaultSessionsExportColumns(t),
    [t],
  );

  const { handleExportCSV, handleBulkExport } = useSessionsExportActions({
    tableColumns: exportColumns,
    canExport,
    search,
    filterStatus,
    filterType,
    sortField,
    sortDir,
    viewingDeleted: showDeleted,
    selectedIds,
    logExportAudit,
  });

  const handleSort = (nextSortField: SessionSortField) => {
    if (sortField === nextSortField) {
      setSortDir((currentDirection) => currentDirection === 'asc' ? 'desc' : 'asc');
      return;
    }
    setSortField(nextSortField);
    setSortDir('asc');
  };

  const toggleFilter = <T,>(selectedValues: T[], setSelectedValues: React.Dispatch<React.SetStateAction<T[]>>, nextValue: T) =>
    toggleFilterValue(selectedValues, setSelectedValues, nextValue);

  const canSelectSessions = canWrite || canDelete;

  const openCreateForm = () => {
    setEditSession(null);
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditSession(null);
  };

  const openEditForm = (sessionToEdit: Session) => {
    setEditSession(sessionToEdit);
    setShowForm(true);
  };

  const confirmDelete = (deletionReason?: string) => {
    if (pendingDeleteId) handleDelete(pendingDeleteId, deletionReason);
    setPendingDeleteId(null);
  };

  return {
    t,
    canWrite,
    canDelete,
    canExport,
    PAGE_TABS,
    activeTab,
    setActiveTab,
    search,
    filterStatus,
    filterType,
    statusOptions,
    typeOptions,
    statusLabels,
    typeLabels,
    viewMode,
    setViewMode,
    columnLayout,
    showForm,
    editSession,
    detailSession,
    setDetailSession,
    showDeleted,
    workPageData: pageData,
    isError,
    isWorkLoading,
    isWorkFetching,
    useServerWork,
    canSelectSessions,
    selectedIds,
    allVisibleSelected,
    someVisibleSelected,
    sortField,
    sortDir,
    statusConfig,
    typeConfig,
    sessions,
    shownCount,
    confirmBulkDeleteOpen,
    setConfirmBulkDeleteOpen,
    confirmBulkRestoreOpen,
    setConfirmBulkRestoreOpen,
    pendingDeleteId,
    setPendingDeleteId,
    setSearch,
    toggleFilter,
    setFilterStatus,
    setFilterType,
    setShowDeleted,
    clearFilters,
    refetch,
    openCreateForm,
    handleSort,
    toggleSelectAll,
    toggleSelectedSession,
    clearSelection,
    handleRestore,
    handleSave,
    handleUpdate,
    closeForm,
    openEditForm,
    confirmDelete,
    handleBulkDelete,
    handleBulkRestore,
    handleBulkStatusChange,
    bulkStatusPending: bulkUpdateSessionStatus.isPending,
    handleExportCSV,
    handleBulkExport,
    setListPage,
  };
}
