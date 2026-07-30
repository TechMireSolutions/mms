import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from '@/hooks/useTranslation';
import { useFilteredModuleTierTabs } from '@/tenant/hooks/useModuleTierTabs';
import { useModulePermissions } from '@/tenant/hooks/usePermissions';
import { UserCog, Users as UsersIcon, Activity, UserPlus } from 'lucide-react';
import {
  normalizeWorkspaceUser,
  resolveModuleTierTab,
  USERS_MODULE_MANIFEST,
  type AppTranslationKey,
  type SystemUser,
} from '@mms/shared';
import { ModulePageShell } from "@/components/ui/ModulePageShell";
import { ResponsiveAccordionTabs } from '@/components/ui/ResponsiveAccordionTabs';
import { Button } from '@/components/ui/button';
import { UsersModalLayer } from '@/tenant/features/users/components/UsersModalLayer';
import { UsersReportsTier } from '@/tenant/features/users/components/UsersReportsTier';
import { UsersSetupTier } from '@/tenant/features/users/components/UsersSetupTier';
import { UsersWorkTier } from '@/tenant/features/users/components/UsersWorkTier';
import { UsersCommandMetrics } from '@/tenant/features/users/components/UsersCommandMetrics';
import { usePersistedTabState } from '@/hooks/usePersistedTabState';
import {
  useUsers,
  useActivityLogs,
} from '@/tenant/features/users/hooks/useUsersApi';
import { useUsersPageActions } from '@/tenant/features/users/hooks/useUsersPageActions';
import { useUserColumnLayout } from '@/tenant/features/users/hooks/useUserColumnLayout';
import { useUserActivityColumnLayout } from '@/tenant/features/users/hooks/useUserActivityColumnLayout';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useMessageComposerState } from '@/hooks/useMessageComposerState';

const SETUP_TAB_LABEL_KEYS: Record<(typeof USERS_MODULE_MANIFEST.setupSubTabs)[number], AppTranslationKey> = {
  permissions: 'users.permissions',
  fields: 'users.setup.fields',
  preferences: 'users.setup.preferences',
};

/**
 * Users and roles — Work | Reports | Setup.
 */
export default function Users(): React.JSX.Element {
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

  return (
    <ModulePageShell
      seoTitle={`MMS - ${t('page.users.title')}`}
      seoDescription={t('page.users.subtitle')}
      headerIcon={UserCog}
      headerTitle={t('page.users.title')}
      headerSubtitle={t('page.users.subtitle')}
      headerActions={
        canWrite && !showDeleted ? (
          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setShowInvite(true)}>
              <UserPlus className="h-3.5 w-3.5" />
              {t('users.invite')}
            </Button>
            <Button type="button" size="sm" onClick={() => setShowAddUser(true)}>
              <UserPlus className="h-3.5 w-3.5" />
              {t('users.add')}
            </Button>
          </div>
        ) : undefined
      }
      metricsStrip={
        <UsersCommandMetrics users={users} shown={users.length} />
      }
    >
      <ResponsiveAccordionTabs
        tabs={visibleTopTabs}
        activeTab={effectiveTab}
        onTabChange={setActiveTab}
        hideWhenSingle
        panelIdPrefix="users-tab"
      >
        <ErrorBoundary>
          {effectiveTab === 'reports' && <UsersReportsTier />}
          {effectiveTab === 'setup' && (
            <UsersSetupTier
              tabs={USERS_CONFIG_TABS}
              activeTab={effectiveConfigTab}
              canEditSetup={canEditSetup}
              onTabChange={setConfigSubTab}
            />
          )}
          {effectiveTab === 'work' && (
            <UsersWorkTier
              tabs={SUB_TABS}
              activeSubTab={effectiveSubTab}
              users={users}
              logs={logs}
              listLoadFailed={listLoadFailed}
              logsLoadFailed={logsLoadFailed}
              canWrite={canWrite}
              canDelete={canDelete}
              showDeleted={showDeleted}
              getUserColumnWidth={getUserColumnWidth}
              setUserColumnWidth={setUserColumnWidth}
              getActivityColumnWidth={getActivityColumnWidth}
              setActivityColumnWidth={setActivityColumnWidth}
              onSubTabChange={setActiveSubTab}
              onRetryUsers={() => { void usersResult.queryResult.refetch(); }}
              onRetryLogs={() => { void logsResult.queryResult.refetch(); }}
              onViewUser={setViewing}
              onEditUser={setEditing}
              onDeleteUser={(id) => { void handleDeleteUser(id); }}
              onRestoreUser={(id) => { void handleRestoreUser(id); }}
              onBulkDeleteUsers={(ids) => { void handleBulkDelete(ids); }}
              onBulkRestoreUsers={(ids) => { void handleBulkRestore(ids); }}
              onResetPassword={handleResetPassword}
              onAddUser={() => setShowAddUser(true)}
              onMessageUsers={handleMessageUsers}
              onToggleDeleted={setShowDeleted}
            />
          )}
        </ErrorBoundary>
      </ResponsiveAccordionTabs>

      <UsersModalLayer
        viewing={viewing}
        editing={editing}
        showAddUser={showAddUser}
        showInvite={showInvite}
        canWrite={canWrite}
        users={users}
        messagingTarget={messagingTarget}
        onCloseViewing={() => setViewing(null)}
        onCloseEditing={() => setEditing(null)}
        onCloseAddUser={() => setShowAddUser(false)}
        onCloseInvite={() => setShowInvite(false)}
        onSaveEdit={handleSaveEdit}
        onAddUser={handleAddUser}
        onInvite={handleInvite}
        onCloseComposer={closeComposer}
      />
    </ModulePageShell>
  );
}
