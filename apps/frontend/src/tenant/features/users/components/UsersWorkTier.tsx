import { motion } from 'framer-motion';
import type { ActivityLog, SystemUser } from '@mms/shared';
import { SubTabBar } from '@/components/ui/SubTabBar';
import { ErrorState } from '@/components/ui/ErrorState';
import { useTranslation } from '@/hooks/useTranslation';
import { ActivityLogs } from '@/tenant/features/users/components/ActivityLogs';
import { UsersList } from '@/tenant/features/users/components/UsersList';

interface UsersWorkSubTab {
  id: string;
  label: string;
}

interface UsersWorkTierProps {
  tabs: UsersWorkSubTab[];
  activeSubTab: string;
  users: SystemUser[];
  logs: ActivityLog[];
  listLoadFailed: boolean;
  logsLoadFailed: boolean;
  canWrite: boolean;
  canDelete: boolean;
  showDeleted: boolean;
  getUserColumnWidth: (key: string) => number | undefined;
  setUserColumnWidth: (key: string, width: number) => void;
  getActivityColumnWidth: (key: string) => number | undefined;
  setActivityColumnWidth: (key: string, width: number) => void;
  onSubTabChange: (subTab: string) => void;
  onRetryUsers: () => void;
  onRetryLogs: () => void;
  onViewUser: (user: SystemUser) => void;
  onEditUser: (user: SystemUser) => void;
  onDeleteUser: (id: string) => void;
  onRestoreUser: (id: string) => void;
  onBulkDeleteUsers: (ids: string[]) => void;
  onBulkRestoreUsers: (ids: string[]) => void;
  onResetPassword: (user: SystemUser) => void;
  onAddUser: () => void;
  onMessageUsers: (channel: 'sms' | 'whatsapp' | 'email', users: SystemUser[]) => void;
  onToggleDeleted: (next: boolean) => void;
}

export function UsersWorkTier({
  tabs,
  activeSubTab,
  users,
  logs,
  listLoadFailed,
  logsLoadFailed,
  canWrite,
  canDelete,
  showDeleted,
  getUserColumnWidth,
  setUserColumnWidth,
  getActivityColumnWidth,
  setActivityColumnWidth,
  onSubTabChange,
  onRetryUsers,
  onRetryLogs,
  onViewUser,
  onEditUser,
  onDeleteUser,
  onRestoreUser,
  onBulkDeleteUsers,
  onBulkRestoreUsers,
  onResetPassword,
  onAddUser,
  onMessageUsers,
  onToggleDeleted,
}: UsersWorkTierProps): React.JSX.Element {
  const { t } = useTranslation();

  return (
    <>
      <SubTabBar
        tabs={tabs.map((tab) => ({ key: tab.id, label: tab.label }))}
        value={activeSubTab}
        onChange={onSubTabChange}
      />

      <motion.div
        key={`work-${activeSubTab}`}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.18 }}
        className="space-y-4"
      >
        {activeSubTab === 'users' && listLoadFailed && (
          <ErrorState
            title={t('users.loadFailed')}
            description={t('users.loadFailedHint')}
            onRetry={onRetryUsers}
          />
        )}

        {activeSubTab === 'users' && !listLoadFailed && (
          <UsersList
            users={users}
            onView={onViewUser}
            onEdit={onEditUser}
            onDelete={onDeleteUser}
            onRestore={onRestoreUser}
            onBulkDelete={onBulkDeleteUsers}
            onBulkRestore={onBulkRestoreUsers}
            onResetPassword={onResetPassword}
            onAddUser={onAddUser}
            onMessage={onMessageUsers}
            canWrite={canWrite}
            canDelete={canDelete}
            showDeleted={showDeleted}
            onToggleDeleted={onToggleDeleted}
            getColumnWidth={getUserColumnWidth}
            onColumnResize={setUserColumnWidth}
          />
        )}

        {activeSubTab === 'activity' && logsLoadFailed && (
          <ErrorState
            title={t('users.loadFailed')}
            description={t('users.loadFailedHint')}
            onRetry={onRetryLogs}
          />
        )}

        {activeSubTab === 'activity' && !logsLoadFailed && (
          <ActivityLogs
            logs={logs}
            users={users}
            getColumnWidth={getActivityColumnWidth}
            onColumnResize={setActivityColumnWidth}
          />
        )}
      </motion.div>
    </>
  );
}
