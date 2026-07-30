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
  useUsers,
  useActivityLogs,
} from '@/tenant/features/users/hooks/useUsersApi';
import { useUsersPageActions } from '@/tenant/features/users/hooks/useUsersPageActions';
import { useUserColumnLayout } from '@/tenant/features/users/hooks/useUserColumnLayout';
import { useUserActivityColumnLayout } from '@/tenant/features/users/hooks/useUserActivityColumnLayout';
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
  const [showDeleted, setShowDeleted] = useState(false);
  const usersResult = useUsers({ includeDeleted: showDeleted });
  const logsResult = useActivityLogs();
  const users = useMemo(
    () => usersResult.syncedData.map((u) => normalizeWorkspaceUser(u as Partial<SystemUser> & { roles?: string[]; role?: string })),
    [usersResult.syncedData],
  );
  const logs = logsResult.syncedData;
  const listLoadFailed = usersResult.queryResult.isError;
  const logsLoadFailed = logsResult.queryResult.isError;

  const { getColumnWidth: getUserColumnWidth, setColumnWidth: setUserColumnWidth } =
    useUserColumnLayout();
  const { getColumnWidth: getActivityColumnWidth, setColumnWidth: setActivityColumnWidth } =
    useUserActivityColumnLayout();

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

  useEffect(() => {
    if (!canWrite || showDeleted) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'n') {
        if (effectiveTab !== 'work' || effectiveSubTab !== 'users') return;
        e.preventDefault();
        setShowInvite(false);
        setShowAddUser(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [canWrite, showDeleted, effectiveTab, effectiveSubTab]);

  const { messagingTarget, openComposer, closeComposer } = useMessageComposerState();

  const handleMessageUsers = (channel: 'sms' | 'whatsapp' | 'email', targetUsers: SystemUser[]) => {
    openComposer(
      channel,
      targetUsers.map((u) => ({
        id: u.id,
        name: u.name,
        phone: u.phone || '',
        email: u.email || '',
      }))
    );
  };

  return {
    t,
    canWrite,
    canDelete,
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
    users,
    logs,
    listLoadFailed,
    logsLoadFailed,
    getUserColumnWidth,
    setUserColumnWidth,
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
    messagingTarget,
    closeComposer,
    refetchUsers: () => { void usersResult.queryResult.refetch(); },
    refetchLogs: () => { void logsResult.queryResult.refetch(); },
  };
}
