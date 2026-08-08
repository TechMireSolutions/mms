import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from '@/hooks/useTranslation';
import { useFilteredModuleTierTabs } from '@/tenant/hooks/useModuleTierTabs';
import { useModulePermissions } from '@/tenant/hooks/usePermissions';
import { Users as UsersIcon, Activity } from 'lucide-react';
import {
  normalizeWorkspaceUser,
  resolveModuleTierTab,
  USERS_MODULE_MANIFEST,
  type AppTranslationKey,
  type SystemUser,
} from '@mms/shared';
import { usePersistedTabState } from '@/hooks/usePersistedTabState';
import {
  useActivityLogs,
  useUsersMutations,
} from '@/tenant/features/users/hooks/useUsersApi';
import { useUsersPaginated } from '@/tenant/features/users/hooks/useUsersListQueries';
import { useUsersDirectoryFilters } from '@/tenant/features/users/hooks/useUsersDirectoryFilters';
import { useUsersKeyboardShortcuts } from '@/tenant/features/users/hooks/useUsersKeyboardShortcuts';
import { useUsersPageActions } from '@/tenant/features/users/hooks/useUsersPageActions';
import { useUserColumnLayout } from '@/tenant/features/users/hooks/useUserColumnLayout';
import { useUserActivityColumnLayout } from '@/tenant/features/users/hooks/useUserActivityColumnLayout';
import {
  defaultUsersExportColumns,
  useUsersExportActions,
} from '@/tenant/features/users/hooks/useUsersExportActions';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useMessageComposerState } from '@/hooks/useMessageComposerState';

const SETUP_TAB_LABEL_KEYS: Record<(typeof USERS_MODULE_MANIFEST.setupSubTabs)[number], AppTranslationKey> = {
  permissions: 'users.permissions',
  fields: 'users.setup.fields',
  preferences: 'users.setup.preferences',
};

export function useUsersPageController() {
  const { t } = useTranslation();
  const { user: authUser } = useAuth();
  const {
    canWrite,
    canDelete,
    canExport,
    canEditSetup,
    canReports: canViewReports,
    canViewSetup,
  } = useModulePermissions(USERS_MODULE_MANIFEST);
  const USERS_CONFIG_TABS = useMemo(
    () => USERS_MODULE_MANIFEST.setupSubTabs.map((id) => ({
      id,
      label: t(SETUP_TAB_LABEL_KEYS[id]),
    })),
    [t],
  );
  const SUB_TABS = useMemo(
    () => [
      { id: 'users', label: t('users.list'), icon: UsersIcon },
      { id: 'activity', label: t('users.activity'), icon: Activity },
    ],
    [t],
  );
  const [activeTab, setActiveTab] = usePersistedTabState<string>('users_active_tab', 'work');
  const [activeSubTab, setActiveSubTab] = usePersistedTabState<string>('users_ops_subtab', 'users');
  const [configSubTab, setConfigSubTab] = usePersistedTabState<string>(
    'users_config_subtab',
    'permissions',
  );
  const {
    listPage,
    setListPage,
    showDeleted,
    setShowDeleted,
    search,
    setSearch,
    debouncedSearch,
    roleFilter,
    setRoleFilter,
    statusFilter,
    setStatusFilter,
    selectedIds,
    setSelectedIds,
    clearFilters,
    clearSelection,
    hasActiveFilters,
  } = useUsersDirectoryFilters();

  const logsResult = useActivityLogs({ enabled: activeTab === 'work' && activeSubTab === 'activity' });
  const logs = logsResult.data ?? [];
  const logsLoadFailed = logsResult.isError;

  const useServerWork = activeTab === 'work' && activeSubTab === 'users';
  const workPageQuery = useUsersPaginated({
    page: listPage,
    limit: USERS_MODULE_MANIFEST.defaultPageSize,
    search: debouncedSearch,
    role: roleFilter,
    status: statusFilter !== 'all' ? statusFilter : undefined,
    includeDeleted: showDeleted,
    enabled: useServerWork,
  });

  const users = useMemo(
    () =>
      (workPageQuery.data?.users ?? []).map((user) =>
        normalizeWorkspaceUser(user as Partial<SystemUser> & { roles?: string[]; role?: string }),
      ),
    [workPageQuery.data],
  );
  const shownCount = workPageQuery.data?.total ?? users.length;
  const listLoadFailed = workPageQuery.isError;

  const {
    getColumnWidth: getUserColumnWidth,
    setColumnWidth: setUserColumnWidth,
    isColumnVisible: isUserColumnVisible,
    columnRegistry: userColumnRegistry,
    updateUserColumnLayout: updateUserColumnLayout,
    customizerLabels: userColumnCustomizerLabels,
  } = useUserColumnLayout();
  const { getColumnWidth: getActivityColumnWidth, setColumnWidth: setActivityColumnWidth } =
    useUserActivityColumnLayout();

  const { logExportAudit } = useUsersMutations();
  const exportColumns = useMemo(() => defaultUsersExportColumns(t), [t]);
  const { handleExportCSV } = useUsersExportActions({
    tableColumns: exportColumns,
    canExport,
    search,
    roleFilter,
    statusFilter,
    viewingDeleted: showDeleted,
    selectedIds,
    logExportAudit,
  });

  useEffect(() => {
    if ((!canViewSetup && activeTab === 'setup') || (!canViewReports && activeTab === 'reports')) {
      setActiveTab('work');
    }
  }, [canViewSetup, canViewReports, activeTab, setActiveTab]);

  const [viewing, setViewing] = useState<SystemUser | null>(null);
  const [editing, setEditing] = useState<SystemUser | null>(null);
  const [showInvite, setShowInvite] = useState(false);
  const [showAddUser, setShowAddUser] = useState(false);

  const actorId = authUser?.id ?? 'system';
  const {
    handleDeleteUser,
    handleRestoreUser,
    handleBulkDelete,
    handleBulkRestore,
    handleResetPassword,
    handleSaveEdit,
    handleInvite,
    handleAddUser,
  } = useUsersPageActions({ users, logs, actorId, t });

  const visibleTopTabs = useFilteredModuleTierTabs({
    canViewSetup,
    canViewReports,
  });

  const effectiveTab = resolveModuleTierTab(
    activeTab,
    visibleTopTabs.map((tab) => tab.id),
  );
  const effectiveSubTab = SUB_TABS.find((tab) => tab.id === activeSubTab) ? activeSubTab : 'users';
  const effectiveConfigTab = USERS_CONFIG_TABS.find((tab) => tab.id === configSubTab)
    ? configSubTab
    : 'permissions';

  useUsersKeyboardShortcuts({
    enabled: effectiveTab === 'work' && effectiveSubTab === 'users',
    selectedCount: selectedIds.length,
    hasActiveFilters,
    clearFilters,
    clearSelection,
    canWrite,
    showDeleted,
    onCreate: () => {
      setShowInvite(false);
      setShowAddUser(true);
    },
  });

  const { messagingTarget, openComposer, closeComposer } = useMessageComposerState();

  const handleMessageUsers = (channel: 'sms' | 'whatsapp' | 'email', targetUsers: SystemUser[]) => {
    openComposer(
      channel,
      targetUsers.map((u) => ({
        id: u.id,
        name: u.name,
        phone: u.phone || '',
        email: u.email || '',
      })),
    );
  };

  return {
    t,
    canWrite,
    canDelete,
    canExport,
    canEditSetup,
    USERS_CONFIG_TABS,
    SUB_TABS,
    activeTab,
    setActiveTab,
    effectiveTab,
    effectiveSubTab,
    effectiveConfigTab,
    setActiveSubTab,
    setConfigSubTab,
    showDeleted,
    setShowDeleted,
    search,
    setSearch,
    roleFilter,
    setRoleFilter,
    statusFilter,
    setStatusFilter,
    listPage,
    setListPage,
    selectedIds,
    setSelectedIds,
    clearFilters,
    users,
    shownCount,
    workPageData: workPageQuery.data,
    isWorkPageLoading: workPageQuery.isLoading,
    isWorkPageFetching: workPageQuery.isFetching,
    logs,
    listLoadFailed,
    logsLoadFailed,
    getUserColumnWidth,
    setUserColumnWidth,
    isUserColumnVisible,
    userColumnRegistry,
    updateUserColumnLayout,
    userColumnCustomizerLabels,
    getActivityColumnWidth,
    setActivityColumnWidth,
    viewing,
    setViewing,
    editing,
    setEditing,
    showInvite,
    setShowInvite,
    showAddUser,
    setShowAddUser,
    visibleTopTabs,
    handleDeleteUser,
    handleRestoreUser,
    handleBulkDelete,
    handleBulkRestore,
    handleResetPassword,
    handleSaveEdit,
    handleInvite,
    handleAddUser,
    handleMessageUsers,
    handleExportCSV,
    messagingTarget,
    closeComposer,
    refetchUsers: () => { void workPageQuery.refetch(); },
    refetchLogs: () => { void logsResult.refetch(); },
  };
}
