import { useEffect, useMemo, useState } from 'react';
import { usePersistedTabState } from '@/hooks/usePersistedTabState';
import { useModuleCreateHotkey } from '@/hooks/useModuleCreateHotkey';
import { useTranslation } from '@/hooks/useTranslation';
import { useFilteredModuleTierTabs } from '@/tenant/hooks/useModuleTierTabs';
import type { SessionSortField, SessionStatus, SessionType } from '@/tenant/features/sessions/components/sessionPageTypes';
import type { Session } from '@/lib/data/sessionsData';
import { useSessionsPaginated, useSessionMutations } from '@/tenant/features/sessions/hooks/useSessions';
import { useSessionDisplayConfig } from '@/tenant/features/sessions/hooks/useSessionDisplayConfig';
import { useSessionColumnLayout } from '@/tenant/features/sessions/hooks/useSessionColumnLayout';
import { useSessionConfig } from '@/hooks/useStandardModuleConfig';
import { useModulePermissions } from '@/tenant/hooks/usePermissions';
import { SESSIONS_MODULE_MANIFEST } from '@mms/shared';
import {
  createSessionBulkDeleteHandler,
  createSessionBulkRestoreHandler,
  createSessionDeleteHandler,
  createSessionRestoreHandler,
  createSessionSaveHandler,
  createSessionUpdateHandler,
} from '@/tenant/features/sessions/hooks/sessionsPageControllerActions';
import { toggleFilterValue, useSessionsSelection } from '@/tenant/features/sessions/hooks/useSessionsSelection';

export function useSessionsPageController() {
  const { canWrite, canDelete, canReports: canViewReports, canViewSetup } =
    useModulePermissions(SESSIONS_MODULE_MANIFEST);
  const PAGE_TABS = useFilteredModuleTierTabs({ canViewSetup, canViewReports });
  const { t } = useTranslation();
  const { createSession, updateSession, deleteSession, restoreSession, bulkDeleteSessions, bulkRestoreSessions } =
    useSessionMutations();
  const { settings, statuses, types } = useSessionConfig();
  const { statusOptions, typeOptions, statusLabels, typeLabels, statusConfig, typeConfig } =
    useSessionDisplayConfig({ statuses, types, t });

  const columnLayout = useSessionColumnLayout();
  const listLayout = (settings.defaultViewLayout || 'cards') === 'list';
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<SessionStatus[]>([]);
  const [filterType, setFilterType] = useState<SessionType[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editSession, setEditSession] = useState<Session | null>(null);
  const [detailSession, setDetailSession] = useState<Session | null>(null);
  const [showDeleted, setShowDeleted] = useState(false);
  const [listPage, setListPage] = useState(1);
  const [sortField, setSortField] = useState<SessionSortField>('name');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [confirmBulkDeleteOpen, setConfirmBulkDeleteOpen] = useState(false);
  const [confirmBulkRestoreOpen, setConfirmBulkRestoreOpen] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = usePersistedTabState<string>('sessions_active_tab', 'work');

  const useServerWork = activeTab === 'work';
  const { data: workPageData, isLoading: isWorkLoading, isFetching: isWorkFetching, isError, refetch } =
    useSessionsPaginated({
      page: listPage,
      limit: SESSIONS_MODULE_MANIFEST.defaultPageSize,
      search,
      status: filterStatus.length > 0 ? filterStatus.join(',') : undefined,
      type: filterType.length > 0 ? filterType.join(',') : undefined,
      sortField,
      sortDir,
      includeDeleted: showDeleted,
      enabled: useServerWork,
    });

  const sessions = useMemo(
    () => (workPageData?.sessions ?? []) as Session[],
    [workPageData],
  );

  const {
    selectedIds,
    setSelectedIds,
    allVisibleSelected,
    someVisibleSelected,
    toggleSelectAll,
    toggleSelectedSession,
  } = useSessionsSelection(sessions);

  useEffect(() => {
    setListPage(1);
    setSelectedIds([]);
  }, [search, filterStatus, filterType, showDeleted, sortField, sortDir, listLayout, setSelectedIds]);

  useModuleCreateHotkey({
    enabled: canWrite && !showDeleted,
    onCreate: () => {
      setEditSession(null);
      setShowForm(true);
    },
  });

  const shownCount = workPageData?.total ?? sessions.length;

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

  const confirmDelete = () => {
    if (pendingDeleteId) handleDelete(pendingDeleteId);
    setPendingDeleteId(null);
  };

  return {
    t,
    canWrite,
    canDelete,
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
    listLayout,
    columnLayout,
    showForm,
    editSession,
    detailSession,
    setDetailSession,
    showDeleted,
    workPageData,
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
    refetch,
    openCreateForm,
    handleSort,
    toggleSelectAll,
    toggleSelectedSession,
    handleRestore,
    handleSave,
    handleUpdate,
    closeForm,
    openEditForm,
    confirmDelete,
    handleBulkDelete,
    handleBulkRestore,
    setListPage,
  };
}
