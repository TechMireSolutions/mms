import { useEffect } from 'react';
import { useTranslation } from '@/hooks/useTranslation';
import { useFilteredModuleTierTabs } from '@/tenant/hooks/useModuleTierTabs';
import { useModulePermissions } from '@/tenant/hooks/usePermissions';
import {
  canAccessRolesAndPermissions,
  normalizeWorkspaceUser,
  resolveModuleTierTab,
  USERS_MODULE_MANIFEST,
  type SystemUser,
} from '@mms/shared';
import { usePersistedTabState } from '@/hooks/usePersistedTabState';
import {
  extractActivityLogs,
  useActivityLogs,
  useUsersByIds,
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
import { buildUsersWorkTierProps } from '@/tenant/features/users/hooks/usersPageWorkTierProps';
import {
  getUsersConfigTabs,
  getUsersSubTabs,
} from '@/tenant/features/users/hooks/usersPageTabConfig';
import { useUsersModalLayer } from './useUsersModalLayer';

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
  const canAccessRoles = canAccessRolesAndPermissions(authUser?.role);
  const USERS_CONFIG_TABS = getUsersConfigTabs(canAccessRoles, t);
  const SUB_TABS = getUsersSubTabs(t);
  const [activeTab, setActiveTab] = usePersistedTabState<string>('users_active_tab', 'work');
  const [activeSubTab, setActiveSubTab] = usePersistedTabState<string>('users_ops_subtab', 'users');
  const [configSubTab, setConfigSubTab] = usePersistedTabState<string>(
    'users_config_subtab',
    'permissions',
  );
  const filters = useUsersDirectoryFilters();
  const {
    listPage,
    showDeleted,
    search,
    debouncedSearch,
    roleFilter,
    statusFilter,
    selectedIds,
    setSelectedIds,
  } = filters;

  const logsResult = useActivityLogs({
    enabled: activeTab === 'work' && activeSubTab === 'activity',
  });
  const logs = extractActivityLogs(logsResult.data);
  const activityUsersResult = useUsersByIds(
    logs.map((log) => log.userId),
    {
      enabled: activeTab === 'work' && activeSubTab === 'activity',
    },
  );
  const activityUsers = activityUsersResult.data as SystemUser[];
  const logsLoadFailed = logsResult.isError;
  const isLogsLoading = logsResult.isLoading || activityUsersResult.isLoading;

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

  const users = ((workPageQuery.data?.users ?? []) as unknown[]).map((user) =>
    normalizeWorkspaceUser(user as Partial<SystemUser> & { roles?: string[]; role?: string }),
  );
  const shownCount = workPageQuery.data?.total ?? users.length;
  const listLoadFailed = workPageQuery.isError;

  const columns = useUserColumnLayout();
  const activityColumns = useUserActivityColumnLayout();

  const { logExportAudit } = useUsersMutations();
  const exportColumns = defaultUsersExportColumns(t);
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

  useEffect(() => {
    setSelectedIds([]);
  }, [activeTab, activeSubTab, setSelectedIds]);

  const actorId = authUser?.id ?? 'system';
  const actions = useUsersPageActions({ actorId, t });

  const {
    setViewing,
    setShowInvite,
    setShowAddUser,
    handleOpenEdit,
    handleOpenPasswordReset,
    handleOpenAddUser,
    handleOpenInviteUser,
    handleMessageUsers,
    modalLayerProps,
  } = useUsersModalLayer({
    authUser,
    canWrite,
    canDelete,
    users,
    actions,
    t,
  });

  const visibleTopTabs = useFilteredModuleTierTabs({
    canViewSetup,
    canViewReports,
  });

  const effectiveTab = resolveModuleTierTab(
    activeTab,
    visibleTopTabs.map((tab) => tab.id),
  );
  const effectiveSubTab = SUB_TABS.find((tab) => tab.id === activeSubTab) ? activeSubTab : 'users';
  const effectiveConfigTab =
    USERS_CONFIG_TABS.find((tab) => tab.id === configSubTab)?.id ??
    USERS_CONFIG_TABS[0]?.id ??
    'preferences';

  useUsersKeyboardShortcuts({
    enabled: effectiveTab === 'work' && effectiveSubTab === 'users',
    selectedCount: selectedIds.length,
    hasActiveFilters: filters.hasActiveFilters,
    clearFilters: filters.clearFilters,
    clearSelection: filters.clearSelection,
    canWrite,
    showDeleted,
    onCreate: () => {
      setShowInvite(false);
      setShowAddUser(true);
    },
  });

  const refetchUsers = () => {
    void workPageQuery.refetch();
  };
  const refetchLogs = () => {
    void logsResult.refetch();
  };

  const workTierProps = buildUsersWorkTierProps({
    tabs: SUB_TABS,
    activeSubTab: effectiveSubTab,
    users,
    activityUsers,
    logs,
    filters,
    columns,
    activityColumns,
    actions,
    workPageData: workPageQuery.data,
    isWorkPageLoading: workPageQuery.isLoading,
    isWorkPageFetching: workPageQuery.isFetching,
    isLogsLoading,
    listLoadFailed,
    logsLoadFailed,
    canWrite,
    canDelete,
    onSubTabChange: setActiveSubTab,
    onRetryUsers: refetchUsers,
    onRetryLogs: refetchLogs,
    onViewUser: setViewing,
    onEditUser: handleOpenEdit,
    onResetPassword: handleOpenPasswordReset,
    onAddUser: handleOpenAddUser,
    onInviteUser: handleOpenInviteUser,
    onMessageUsers: handleMessageUsers,
  });

  return {
    t,
    canWrite,
    canExport,
    canEditSetup,
    showDeleted,
    shownCount,
    visibleTopTabs,
    effectiveTab,
    effectiveSubTab,
    setActiveTab,
    USERS_CONFIG_TABS,
    effectiveConfigTab,
    setConfigSubTab,
    handleExportCSV,
    onAddUser: handleOpenAddUser,
    onInviteUser: handleOpenInviteUser,
    refetchUsers,
    refetchLogs,
    workTierProps,
    modalLayerProps,
  };
}
