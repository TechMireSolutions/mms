import { useState, useEffect } from 'react';
import { useTranslation } from '@/hooks/useTranslation';
import { useFilteredModuleTierTabs } from '@/tenant/hooks/useModuleTierTabs';
import { useModulePermissions } from '@/tenant/hooks/usePermissions';
import {
  canAccessRolesAndPermissions,
  canManageTargetUser,
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
import { useMessageComposerState } from '@/hooks/useMessageComposerState';
import { notify } from '@/lib/notify';
import { buildUsersWorkTierProps } from '@/tenant/features/users/hooks/usersPageWorkTierProps';
import { buildUsersModalLayerProps } from '@/tenant/features/users/hooks/usersPageModalLayerProps';
import { getUsersConfigTabs, getUsersSubTabs } from '@/tenant/features/users/hooks/usersPageTabConfig';

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

  const logsResult = useActivityLogs({ enabled: activeTab === 'work' && activeSubTab === 'activity' });
  const logs = extractActivityLogs(logsResult.data);
  const activityUsersResult = useUsersByIds(logs.map((log) => log.userId), {
    enabled: activeTab === 'work' && activeSubTab === 'activity',
  });
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

  const [viewing, setViewing] = useState<SystemUser | null>(null);
  const [editing, setEditing] = useState<SystemUser | null>(null);
  const [resettingPasswordFor, setResettingPasswordFor] = useState<SystemUser | null>(null);
  const [showInvite, setShowInvite] = useState(false);
  const [showAddUser, setShowAddUser] = useState(false);

  const actorId = authUser?.id ?? 'system';

  const handleOpenEdit = (user: SystemUser): void => {
    if (!canManageTargetUser(authUser?.role, user.role)) {
      notify.error(t('users.errors.cannotModifySuperAdmin'));
      return;
    }
    setEditing(user);
  };

  const handleOpenPasswordReset = (user: SystemUser): void => {
    if (user.id === actorId) {
      notify.info(t('users.resetPasswordSelfTitle'), {
        description: t('users.resetPasswordSelfDescription'),
      });
      return;
    }
    if (!canManageTargetUser(authUser?.role, user.role)) {
      notify.error(t('users.errors.cannotResetSuperAdminPassword'));
      return;
    }
    setResettingPasswordFor(user);
  };

  const actions = useUsersPageActions({ actorId, t });

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

  const handleOpenAddUser = () => setShowAddUser(true);
  const handleOpenInviteUser = () => setShowInvite(true);
  const refetchUsers = () => { void workPageQuery.refetch(); };
  const refetchLogs = () => { void logsResult.refetch(); };

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

  const modalLayerProps = buildUsersModalLayerProps({
    viewing,
    editing,
    resettingPasswordFor,
    showAddUser,
    showInvite,
    canWrite,
    canDelete,
    users,
    messagingTarget,
    actions,
    setViewing,
    setEditing,
    setResettingPasswordFor,
    setShowAddUser,
    setShowInvite,
    handleOpenEdit,
    closeComposer,
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
