import React, { useState, useEffect, useCallback, useMemo } from 'react';
import useTranslation from '@/hooks/useTranslation';
import useModuleTierTabs from '@/hooks/useModuleTierTabs';
import useConfigSubTabs from '@/hooks/useConfigSubTabs';
import { motion, AnimatePresence } from 'framer-motion';
import { UserCog, Users as UsersIcon, Activity, UserPlus } from 'lucide-react';
import {
  normalizeWorkspaceUser,
  type ActivityLog,
  type SystemUser,
  type UserStatus,
} from '@mms/shared';
import PageHeader from '../components/ui/PageHeader';
import ResponsiveAccordionTabs from '@/components/ui/ResponsiveAccordionTabs';
import { Button } from '@/components/ui/button';
import UsersList from '../components/users/UsersList';
import UserDetailModal from '../components/users/UserDetailModal';
import InviteUserModal from '../components/users/InviteUserModal';
import EditUserModal from '../components/users/EditUserModal';
import AddUserModal from '../components/users/AddUserModal';
import RolesPermissions from '../components/users/RolesPermissions';
import UsersSettingsPanel from '../components/users/UsersSettingsPanel';
import ActivityLogs from '../components/users/ActivityLogs';
import ModuleReports from '../components/reports/ModuleReports';
import SubTabBar from '@/components/ui/SubTabBar';
import { saveCollection } from '../lib/db';
import { useLiveCollection } from '../hooks/useLiveCollection';
import { useIsAdminViewer, useViewerRole } from '@/hooks/useViewerRole';
import { usePersistedTabState } from '@/hooks/usePersistedTabState';
import ErrorBoundary from '@/components/ui/ErrorBoundary';
import { useAuth } from '@/lib/contexts/AuthContext';
import { notify } from '@/lib/notify';

/**
 * Users and roles — Work | Reports | Setup.
 */
export default function Users(): React.JSX.Element {
  const PAGE_TABS = useModuleTierTabs();
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
  const viewerRole = useViewerRole();
  const isAdmin = useIsAdminViewer();
  const rawUsers = useLiveCollection('users');
  const users = useMemo(
    () => rawUsers.map((u) => normalizeWorkspaceUser(u as Partial<SystemUser> & { roles?: string[]; role?: string })),
    [rawUsers],
  );
  const logs = useLiveCollection('user_activity_logs');

  const saveUsers = useCallback(
    (updater: SystemUser[] | ((prev: SystemUser[]) => SystemUser[])) => {
      const next = typeof updater === 'function' ? updater(users) : updater;
      saveCollection('users', next);
    },
    [users],
  );

  const saveLogs = useCallback(
    (updater: ActivityLog[] | ((prev: ActivityLog[]) => ActivityLog[])) => {
      const next = typeof updater === 'function' ? updater(logs) : updater;
      saveCollection('user_activity_logs', next);
    },
    [logs],
  );

  useEffect(() => {
    if (!isAdmin && (activeTab === 'setup' || activeTab === 'reports')) {
      setActiveTab('work');
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

  const visibleTopTabs = PAGE_TABS.filter((tab) => {
    if (tab.id === 'setup' || tab.id === 'reports') return isAdmin;
    return true;
  });

  const effectiveTab = visibleTopTabs.find((tab) => tab.id === activeTab) ? activeTab : 'work';
  const effectiveSubTab = SUB_TABS.find((tab) => tab.id === activeSubTab) ? activeSubTab : 'users';

  return (
    <div className="mx-auto max-w-7xl space-y-5">
      <title>MMS - {t('page.users.title')}</title>
      <meta name="description" content={t('page.users.subtitle')} />
      <PageHeader
        icon={UserCog}
        title={t('page.users.title')}
        subtitle={t('page.users.subtitle')}
        actions={
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
      />

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
                <ModuleReports category="faculty" role={viewerRole} />
              )}
              {effectiveTab === 'setup' && (
                <div className="space-y-4">
                  <SubTabBar
                    tabs={USERS_CONFIG_TABS.map((tab) => ({ key: tab.id, label: tab.label }))}
                    value={configSubTab}
                    onChange={(key) => setConfigSubTab(key as typeof configSubTab)}
                  />
                  {configSubTab === 'permissions' && <RolesPermissions />}
                  {configSubTab === 'fields' && <UsersSettingsPanel mode="fields" />}
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
                  onInvite={() => setShowInvite(true)}
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
    </div>
  );
}
