import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from '@/hooks/useTranslation';
import { useFilteredModuleTierTabs } from '@/tenant/hooks/useModuleTierTabs';
import { useModulePermissions } from '@/tenant/hooks/usePermissions';
import { motion, AnimatePresence } from 'framer-motion';
import { UserCog, Users as UsersIcon, Activity, UserPlus } from 'lucide-react';
import {
  normalizeWorkspaceUser,
  resolveModuleTierTab,
  USERS_MODULE_MANIFEST,
  type ActivityLog,
  type AppTranslationKey,
  type SystemUser,
} from '@mms/shared';
import { ModulePageShell } from "@/components/ui/ModulePageShell";
import { ResponsiveAccordionTabs } from '@/components/ui/ResponsiveAccordionTabs';
import { Button } from '@/components/ui/button';
import { UsersList } from "@/tenant/features/users/components/UsersList";
import { UserDetailModal } from "@/tenant/features/users/components/UserDetailModal";
import { InviteUserModal } from "@/tenant/features/users/components/InviteUserModal";
import { EditUserModal } from "@/tenant/features/users/components/EditUserModal";
import { AddUserModal } from "@/tenant/features/users/components/AddUserModal";
import { RolesPermissions } from "@/tenant/features/users/components/RolesPermissions";
import { UsersSettingsPanel } from "@/tenant/features/users/components/UsersSettingsPanel";
import { ActivityLogs } from "@/tenant/features/users/components/ActivityLogs";
import ModuleReports from '@/tenant/features/reports/components/ModuleReports';
import KPISummary from '@/tenant/features/reports/components/KPISummary';
import { UsersCommandMetrics } from '@/tenant/features/users/components/UsersCommandMetrics';
import { SubTabBar } from '@/components/ui/SubTabBar';
import { usePersistedTabState } from '@/hooks/usePersistedTabState';
import {
  useUsers,
  useActivityLogs,
  useUsersMutations,
} from '@/tenant/features/users/hooks/useUsersApi';
import { useUserColumnLayout } from '@/tenant/features/users/hooks/useUserColumnLayout';
import { useUserActivityColumnLayout } from '@/tenant/features/users/hooks/useUserActivityColumnLayout';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { ErrorState } from '@/components/ui/ErrorState';
import { useAuth } from '@/lib/contexts/AuthContext';
import { notify } from '@/lib/notify';
import { useMessageComposerState } from '@/hooks/useMessageComposerState';

const MessageComposer = React.lazy(() => import('@/components/ui/MessageComposer'));

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

  const {
    replaceUsers,
    replaceLogs,
    deleteUser,
    restoreUser,
    bulkDeleteUsers,
    bulkRestoreUsers,
  } = useUsersMutations();

  const saveUsers = useCallback(
    async (updater: SystemUser[] | ((prev: SystemUser[]) => SystemUser[])) => {
      const nextUsers = typeof updater === 'function' ? updater(users) : updater;
      await replaceUsers.mutateAsync(nextUsers);
    },
    [users, replaceUsers],
  );

  const saveLogs = useCallback(
    async (updater: ActivityLog[] | ((prev: ActivityLog[]) => ActivityLog[])) => {
      const nextLogs = typeof updater === 'function' ? updater(logs) : updater;
      await replaceLogs.mutateAsync(nextLogs);
    },
    [logs, replaceLogs],
  );

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

  const addLog = useCallback(
    async (entry: Partial<ActivityLog> & { action: ActivityLog['action']; module: string; detail: string }) => {
      await saveLogs((prev) => [
        {
          id: `log${Date.now()}`,
          userId: entry.userId ?? actorId,
          action: entry.action,
          module: entry.module,
          detail: entry.detail,
          ts: new Date().toISOString(),
          ip: entry.ip ?? 'local',
        },
        ...prev,
      ]);
    },
    [actorId, saveLogs],
  );

  const handleDeleteUser = async (id: string): Promise<void> => {
    try {
      await deleteUser.mutateAsync(id);
      notify.success(t('users.trash.deleted'));
      await addLog({ action: 'delete', module: 'users', detail: t('users.logDeleted', { id }) });
    } catch (error: unknown) {
      notify.error(t('users.trash.actionFailed'), {
        description: error instanceof Error ? error.message : String(error),
      });
    }
  };

  const handleRestoreUser = async (id: string): Promise<void> => {
    try {
      await restoreUser.mutateAsync(id);
      notify.success(t('users.trash.restored'));
      await addLog({ action: 'update', module: 'users', detail: t('users.logRestored', { id }) });
    } catch (error: unknown) {
      notify.error(t('users.trash.actionFailed'), {
        description: error instanceof Error ? error.message : String(error),
      });
    }
  };

  const handleBulkDelete = async (ids: string[]): Promise<void> => {
    try {
      const result = await bulkDeleteUsers.mutateAsync(ids);
      if (result.failed > 0) {
        notify.warning(t('users.trash.bulkPartial', {
          succeeded: result.succeeded,
          failed: result.failed,
        }));
      } else {
        notify.success(t('users.trash.deleted'));
      }
    } catch (error: unknown) {
      notify.error(t('users.trash.actionFailed'), {
        description: error instanceof Error ? error.message : String(error),
      });
    }
  };

  const handleBulkRestore = async (ids: string[]): Promise<void> => {
    try {
      const result = await bulkRestoreUsers.mutateAsync(ids);
      if (result.failed > 0) {
        notify.warning(t('users.trash.bulkPartial', {
          succeeded: result.succeeded,
          failed: result.failed,
        }));
      } else {
        notify.success(t('users.trash.restored'));
      }
    } catch (error: unknown) {
      notify.error(t('users.trash.actionFailed'), {
        description: error instanceof Error ? error.message : String(error),
      });
    }
  };

  const handleResetPassword = (user: SystemUser): void => {
    void addLog({
      action: 'update',
      module: 'users',
      detail: t('users.logPasswordReset', { name: user.name }),
      ip: 'local',
    });
    notify.info(t('users.resetPasswordToast'), {
      description: t('users.resetPasswordToastDesc', { email: user.email }),
    });
  };

  const handleSaveEdit = async (updated: SystemUser): Promise<void> => {
    await saveUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
    await addLog({ action: 'update', module: 'users', detail: t('users.logUpdated', { name: updated.name }) });
  };

  const handleInvite = async (user: SystemUser): Promise<void> => {
    await saveUsers((prev) => [user, ...prev]);
    await addLog({
      action: 'create',
      module: 'users',
      detail: t('users.logInvited', { name: user.name, email: user.email }),
      ip: 'local',
    });
  };

  const handleAddUser = async (user: SystemUser): Promise<void> => {
    await saveUsers((prev) => [user, ...prev]);
    await addLog({
      action: 'create',
      module: 'users',
      detail: t('users.logCreated', { name: user.name, email: user.email, role: user.role }),
    });
  };

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
        phone: (u as unknown as { phone?: string }).phone || '',
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
        {effectiveTab === 'work' && (
          <SubTabBar
            tabs={SUB_TABS.map((tab) => ({ key: tab.id, label: tab.label }))}
            value={effectiveSubTab}
            onChange={setActiveSubTab}
          />
        )}

        <ErrorBoundary>
          <AnimatePresence mode="wait">
            <motion.div
              key={`${effectiveTab}-${effectiveSubTab}-${configSubTab}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="space-y-4"
            >
              {effectiveTab === 'reports' && (
                <div className="space-y-4">
                  <KPISummary category="faculty" />
                  <ModuleReports category="faculty" />
                </div>
              )}
              {effectiveTab === 'setup' && (
                <div className="space-y-4">
                  <SubTabBar
                    tabs={USERS_CONFIG_TABS.map((tab) => ({ key: tab.id, label: tab.label }))}
                    value={effectiveConfigTab}
                    onChange={setConfigSubTab}
                  />
                  {!canEditSetup ? (
                    <p className="text-sm text-muted-foreground rounded-xl border border-border bg-muted/20 px-4 py-6">
                      {t('users.setup.readOnly')}
                    </p>
                  ) : (
                    <>
                      {effectiveConfigTab === 'permissions' && <RolesPermissions />}
                      {effectiveConfigTab === 'fields' && <UsersSettingsPanel mode="fields" />}
                      {effectiveConfigTab === 'preferences' && <UsersSettingsPanel mode="preferences" />}
                    </>
                  )}
                </div>
              )}

              {effectiveTab === 'work' && effectiveSubTab === 'users' && listLoadFailed && (
                <ErrorState
                  title={t('users.loadFailed')}
                  onRetry={() => { void usersResult.queryResult.refetch(); }}
                />
              )}

              {effectiveTab === 'work' && effectiveSubTab === 'users' && !listLoadFailed && (
                <UsersList
                  users={users}
                  onView={setViewing}
                  onEdit={setEditing}
                  onDelete={(id) => { void handleDeleteUser(id); }}
                  onRestore={(id) => { void handleRestoreUser(id); }}
                  onBulkDelete={(ids) => { void handleBulkDelete(ids); }}
                  onBulkRestore={(ids) => { void handleBulkRestore(ids); }}
                  onResetPassword={handleResetPassword}
                  onAddUser={() => setShowAddUser(true)}
                  onMessage={handleMessageUsers}
                  canWrite={canWrite}
                  canDelete={canDelete}
                  showDeleted={showDeleted}
                  onToggleDeleted={setShowDeleted}
                  getColumnWidth={getUserColumnWidth}
                  onColumnResize={setUserColumnWidth}
                />
              )}

              {effectiveTab === 'work' && effectiveSubTab === 'activity' && logsLoadFailed && (
                <ErrorState
                  title={t('users.loadFailed')}
                  onRetry={() => { void logsResult.queryResult.refetch(); }}
                />
              )}

              {effectiveTab === 'work' && effectiveSubTab === 'activity' && !logsLoadFailed && (
                <ActivityLogs
                  logs={logs}
                  users={users}
                  getColumnWidth={getActivityColumnWidth}
                  onColumnResize={setActivityColumnWidth}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </ErrorBoundary>
      </ResponsiveAccordionTabs>

      <AnimatePresence>
        {viewing ? (
          <UserDetailModal user={viewing} onClose={() => setViewing(null)} />
        ) : null}
        {editing && canWrite ? (
          <EditUserModal user={editing} onClose={() => setEditing(null)} onSave={handleSaveEdit} />
        ) : null}
        {showAddUser && canWrite ? (
          <AddUserModal
            onClose={() => setShowAddUser(false)}
            onAdd={handleAddUser}
            existingEmails={users.map((u) => u.email.toLowerCase())}
          />
        ) : null}
        {showInvite && canWrite ? (
          <InviteUserModal
            onClose={() => setShowInvite(false)}
            onInvite={handleInvite}
            existingContactIds={users.map((u) => u.contactId).filter((id): id is string | number => id != null)}
          />
        ) : null}
      </AnimatePresence>

      {messagingTarget && (
        <React.Suspense fallback={null}>
          <MessageComposer
            channel={messagingTarget.channel}
            recipients={messagingTarget.recipients}
            onClose={closeComposer}
          />
        </React.Suspense>
      )}
    </ModulePageShell>
  );
}
