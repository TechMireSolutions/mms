import { motion } from 'framer-motion';
import type { ActivityLog, ModuleColumnRegistryEntry, SystemUser, UsersListPageResult } from '@mms/shared';
import { SubTabBar } from '@/components/ui/SubTabBar';
import { ErrorState } from '@/components/ui/ErrorState';
import type { ModuleColumnCustomizerLabels } from '@/components/ui/ModuleColumnCustomizer';
import { useTranslation } from '@/hooks/useTranslation';
import { useUsersCollection } from '@/tenant/features/users/hooks/useUsersApi';
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
  workPageData?: UsersListPageResult;
  listPage: number;
  onPageChange: (page: number) => void;
  search: string;
  roleFilter: string;
  statusFilter: string;
  selectedIds: string[];
  onSelectedIdsChange: (ids: string[]) => void;
  onSearchChange: (value: string) => void;
  onRoleFilterChange: (value: string) => void;
  onStatusFilterChange: (value: string) => void;
  logs: ActivityLog[];
  listLoadFailed: boolean;
  logsLoadFailed: boolean;
  isWorkPageLoading: boolean;
  isWorkPageFetching: boolean;
  canWrite: boolean;
  canDelete: boolean;
  showDeleted: boolean;
  getUserColumnWidth: (key: string) => number | undefined;
  setUserColumnWidth: (key: string, width: number) => void;
  isUserColumnVisible: (key: string) => boolean;
  userColumnRegistry: ModuleColumnRegistryEntry[];
  updateUserColumnLayout: (columnRegistry: ModuleColumnRegistryEntry[]) => void;
  userColumnCustomizerLabels: ModuleColumnCustomizerLabels;
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
  onInviteUser: () => void;
  onMessageUsers: (channel: 'sms' | 'whatsapp' | 'email', users: SystemUser[]) => void;
  onToggleDeleted: (next: boolean) => void;
}

export function UsersWorkTier({
  tabs,
  activeSubTab,
  users,
  workPageData,
  listPage,
  onPageChange,
  search,
  roleFilter,
  statusFilter,
  selectedIds,
  onSelectedIdsChange,
  onSearchChange,
  onRoleFilterChange,
  onStatusFilterChange,
  logs,
  listLoadFailed,
  logsLoadFailed,
  isWorkPageLoading,
  isWorkPageFetching,
  canWrite,
  canDelete,
  showDeleted,
  getUserColumnWidth,
  setUserColumnWidth,
  isUserColumnVisible,
  userColumnRegistry,
  updateUserColumnLayout,
  userColumnCustomizerLabels,
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
  onInviteUser,
  onMessageUsers,
  onToggleDeleted,
}: UsersWorkTierProps): React.JSX.Element {
  const { t } = useTranslation();
  const activityUsers = useUsersCollection({
    enabled: activeSubTab === 'activity',
  }) as SystemUser[];

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
        aria-busy={activeSubTab === 'users' && isWorkPageFetching ? true : undefined}
      >
        {activeSubTab === 'users' && (
          <UsersList
            users={users}
            workPageData={workPageData}
            listPage={listPage}
            onPageChange={onPageChange}
            search={search}
            roleFilter={roleFilter}
            statusFilter={statusFilter}
            selectedIds={selectedIds}
            onSelectedIdsChange={onSelectedIdsChange}
            onSearchChange={onSearchChange}
            onRoleFilterChange={onRoleFilterChange}
            onStatusFilterChange={onStatusFilterChange}
            onView={onViewUser}
            onEdit={onEditUser}
            onDelete={onDeleteUser}
            onRestore={onRestoreUser}
            onBulkDelete={onBulkDeleteUsers}
            onBulkRestore={onBulkRestoreUsers}
            onResetPassword={onResetPassword}
            onAddUser={onAddUser}
            onInviteUser={onInviteUser}
            onMessage={onMessageUsers}
            canWrite={canWrite}
            canDelete={canDelete}
            showDeleted={showDeleted}
            onToggleDeleted={onToggleDeleted}
            isLoading={isWorkPageLoading}
            isError={listLoadFailed}
            isFetching={isWorkPageFetching}
            onRetry={onRetryUsers}
            getColumnWidth={getUserColumnWidth}
            onColumnResize={setUserColumnWidth}
            isColumnVisible={isUserColumnVisible}
            columnRegistry={userColumnRegistry}
            updateUserColumnLayout={updateUserColumnLayout}
            customizerLabels={userColumnCustomizerLabels}
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
            users={activityUsers}
            getColumnWidth={getActivityColumnWidth}
            onColumnResize={setActivityColumnWidth}
          />
        )}
      </motion.div>
    </>
  );
}
