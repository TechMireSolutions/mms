import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from '@/hooks/useTranslation';
import { useModuleTierTabs, useFilteredModuleTierTabs } from '@/tenant/hooks/useModuleTierTabs';
import { useConfigSubTabs } from '@/tenant/hooks/useConfigSubTabs';
import { motion, AnimatePresence } from 'framer-motion';
import { UserCog, Users as UsersIcon, Activity, UserPlus } from 'lucide-react';
import {
  normalizeWorkspaceUser,
  resolveModuleTierTab,
  type ActivityLog,
  type SystemUser,
  type UserStatus,
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
import { useIsAdminViewer } from '@/tenant/hooks/useViewerRole';
import { usePersistedTabState } from '@/hooks/usePersistedTabState';
import {
  useUsersCollection,
  useActivityLogsCollection,
  useUsersMutations,
} from '@/tenant/features/users/hooks/useUsersApi';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { useAuth } from '@/lib/contexts/AuthContext';
import { notify } from '@/lib/notify';

/**
 * Users and roles — Work | Reports | Setup.
 */
export default function Users(): React.JSX.Element {
  const configSubTabs = useConfigSubTabs();
  const { t } = useTranslation();
  const { user: authUser } = useAuth();
  const USERS_CONFIG_TABS = useMemo(
    () => [
      { id: 'permissions' as const, label: t('users.permissions') },
      ...configSubTabs,
    ],
    [t, configSubTabs],
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
  const isAdmin = useIsAdminViewer();
  const rawUsers = useUsersCollection();
  const users = useMemo(
    () => rawUsers.map((u) => normalizeWorkspaceUser(u as Partial<SystemUser> & { roles?: string[]; role?: string })),
    [rawUsers],
  );
  const logs = useActivityLogsCollection();

  const { replaceUsers, replaceLogs } = useUsersMutations();

  const saveUsers = useCallback(
    (updater: SystemUser[] | ((prev: SystemUser[]) => SystemUser[])) => {
      const nextUsers = typeof updater === 'function' ? updater(users) : updater;
      replaceUsers.mutate(nextUsers);
    },
    [users, replaceUsers],
  );

  const saveLogs = useCallback(
    (updater: ActivityLog[] | ((prev: ActivityLog[]) => ActivityLog[])) => {
      const nextLogs = typeof updater === 'function' ? updater(logs) : updater;
      replaceLogs.mutate(nextLogs);
    },
    [logs, replaceLogs],
  );

  useEffect(() => {
    if (!isAdmin && (activeTab === 'setup' || activeTab === 'reports')) {
      setActiveTab('');
    }
  }, [isAdmin, activeTab, setActiveTab]);

  const [viewing, setViewing] = useState<SystemUser | null>(null);
  const [editing, setEditing] = useState<SystemUser | null>(null);
  const [showInvite, setShowInvite] = useState(false);
  const [showAddUser, setShowAddUser] = useState(false);

  const actorId = authUser?.id ?? 'system';

  const addLog = useCallback(
    (entry: Partial<ActivityLog> & { action: ActivityLog['action']; module: string; detail: string }) => {
      saveLogs((prev) => [
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

  const handleToggleStatus = (id: string, newStatus: UserStatus): void => {
    saveUsers((prev) => prev.map((u) => (u.id === id ? { ...u, status: newStatus } : u)));
    addLog({
      action: 'update',
      module: 'users',
      detail: t('users.logStatusChanged', { id, status: t(`users.status.${newStatus}`) }),
    });
  };

  const handleResetPassword = (user: SystemUser): void => {
    addLog({
      action: 'update',
      module: 'users',
      detail: t('users.logPasswordReset', { name: user.name }),
      ip: 'local',
    });
    notify.info(t('users.resetPasswordToast'), {
      description: t('users.resetPasswordToastDesc', { email: user.email }),
    });
  };

  const handleSaveEdit = (updated: SystemUser): void => {
    saveUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
    addLog({ action: 'update', module: 'users', detail: t('users.logUpdated', { name: updated.name }) });
  };

  const handleInvite = (user: SystemUser): void => {
    saveUsers((prev) => [user, ...prev]);
    addLog({
      action: 'create',
      module: 'users',
      detail: t('users.logInvited', { name: user.name, email: user.email }),
      ip: 'local',
    });
  };

  const handleAddUser = (user: SystemUser): void => {
    saveUsers((prev) => [user, ...prev]);
    addLog({
      action: 'create',
      module: 'users',
      detail: t('users.logCreated', { name: user.name, email: user.email, role: user.role }),
    });
  };

  const visibleTopTabs = useFilteredModuleTierTabs({
    canViewSetup: isAdmin,
    canViewReports: isAdmin,
  });

  const effectiveTab = resolveModuleTierTab(
    activeTab,
    visibleTopTabs.map((tab) => tab.id),
  );
  const effectiveSubTab = SUB_TABS.find((tab) => tab.id === activeSubTab) ? activeSubTab : 'users';

  return (
    <ModulePageShell
      seoTitle={`MMS - ${t('page.users.title')}`}
      seoDescription={t('page.users.subtitle')}
      headerIcon={UserCog}
      headerTitle={t('page.users.title')}
      headerSubtitle={t('page.users.subtitle')}
      headerActions={
        isAdmin ? (
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
        ) : null
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
                    value={configSubTab}
                    onChange={(key) => setConfigSubTab(key as typeof configSubTab)}
                  />
                  {configSubTab === 'permissions' && <RolesPermissions />}
                  {configSubTab === 'preferences' && <UsersSettingsPanel mode="preferences" />}
                </div>
              )}

              {effectiveTab === 'work' && effectiveSubTab === 'users' && (
                <UsersList
                  users={users}
                  onView={setViewing}
                  onEdit={setEditing}
                  onToggleStatus={handleToggleStatus}
                  onResetPassword={handleResetPassword}
                  onAddUser={() => setShowAddUser(true)}
                />
              )}

              {effectiveTab === 'work' && effectiveSubTab === 'activity' && (
                <ActivityLogs logs={logs} users={users} />
              )}
            </motion.div>
          </AnimatePresence>
        </ErrorBoundary>
      </ResponsiveAccordionTabs>

      <AnimatePresence>
        {viewing ? (
          <UserDetailModal user={viewing} onClose={() => setViewing(null)} />
        ) : null}
        {editing ? (
          <EditUserModal user={editing} onClose={() => setEditing(null)} onSave={handleSaveEdit} />
        ) : null}
        {showAddUser ? (
          <AddUserModal
            onClose={() => setShowAddUser(false)}
            onAdd={handleAddUser}
            existingEmails={users.map((u) => u.email.toLowerCase())}
          />
        ) : null}
        {showInvite ? (
          <InviteUserModal
            onClose={() => setShowInvite(false)}
            onInvite={handleInvite}
            existingContactIds={users.map((u) => u.contactId).filter((id): id is string | number => id != null)}
          />
        ) : null}
      </AnimatePresence>
    </ModulePageShell>
  );
}
