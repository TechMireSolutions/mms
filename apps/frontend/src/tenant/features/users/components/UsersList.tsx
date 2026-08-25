import React, { useMemo } from 'react';
import { UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { ModuleColumnRegistryEntry, SystemUser, UsersListPageResult } from '@mms/shared';
import { useTranslation } from '@/hooks/useTranslation';
import { useWorkDirectoryViewMode } from '@/hooks/useWorkDirectoryViewMode';
import { useGlobalSettings } from '@/tenant/hooks/useGlobalSettings';
import { useWorkspaceRoles } from '@/tenant/hooks/useWorkspaceRoles';
import { formatDate } from '@mms/shared';
import type { ModuleColumnCustomizerLabels } from '@/components/ui/ModuleColumnCustomizer';
import { ModuleWorkListStateShell } from '@/components/ui/ModuleWorkListStateShell';
import { UsersListContent } from '@/tenant/features/users/components/UsersListContent';
import { UsersListFilters } from '@/tenant/features/users/components/UsersListFilters';
import { UsersBulkActionBar } from '@/tenant/features/users/components/UsersBulkActionBar';
import {
  getDirectoryPageSelection,
  toggleIdInSelection,
  togglePageIdsInSelection,
} from '@/lib/directorySelection';

export interface UsersListProps {
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
  onView: (user: SystemUser) => void;
  onEdit: (user: SystemUser) => void;
  onDelete: (id: string) => void;
  onRestore: (id: string) => void;
  onBulkDelete: (ids: string[]) => void;
  onBulkRestore: (ids: string[]) => void;
  onResetPassword: (user: SystemUser) => void;
  onAddUser: () => void;
  onInviteUser?: () => void;
  onMessage?: (channel: 'sms' | 'whatsapp' | 'email', users: SystemUser[]) => void;
  canWrite?: boolean;
  canDelete?: boolean;
  showDeleted?: boolean;
  onToggleDeleted?: (next: boolean) => void;
  isLoading?: boolean;
  isError?: boolean;
  isFetching?: boolean;
  onRetry?: () => void;
  getColumnWidth?: (key: string) => number | undefined;
  onColumnResize?: (key: string, width: number) => void;
  isColumnVisible?: (key: string) => boolean;
  columnRegistry?: ModuleColumnRegistryEntry[];
  updateUserColumnLayout?: (columnRegistry: ModuleColumnRegistryEntry[]) => void;
  customizerLabels?: ModuleColumnCustomizerLabels;
}

export function UsersList({
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
  onView,
  onEdit,
  onDelete,
  onRestore,
  onBulkDelete,
  onBulkRestore,
  onResetPassword,
  onAddUser,
  onInviteUser,
  onMessage,
  canWrite = true,
  canDelete = true,
  showDeleted = false,
  onToggleDeleted,
  isLoading = false,
  isError = false,
  isFetching = false,
  onRetry,
  getColumnWidth,
  onColumnResize,
  isColumnVisible,
  columnRegistry,
  updateUserColumnLayout,
  customizerLabels,
}: UsersListProps): React.JSX.Element {
  const { viewMode, setViewMode } = useWorkDirectoryViewMode();
  const { t } = useTranslation();
  const globalSettings = useGlobalSettings();
  const workspaceRoles = useWorkspaceRoles();

  const pageIds = users.map((user) => user.id);
  const { allSelected, someSelected } = getDirectoryPageSelection(pageIds, selectedIds);

  const toggleSelect = (id: string): void =>
    onSelectedIdsChange(toggleIdInSelection(selectedIds, id));
  const toggleAll = (): void =>
    onSelectedIdsChange(togglePageIdsInSelection(selectedIds, pageIds));

  const fmtDate = (ts: string): string => {
    if (!ts) return t('users.never');
    return formatDate(ts, globalSettings.dateFormat, false);
  };

  const selectedUsers = useMemo(
    () => users.filter((user) => selectedIds.includes(user.id)),
    [users, selectedIds],
  );

  const pageData = workPageData
    ? {
        page: workPageData.page ?? listPage,
        total: workPageData.total,
        limit: workPageData.limit,
        hasMore: workPageData.hasMore,
      }
    : undefined;

  return (
    <div className="space-y-4">
      <UsersListFilters
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        search={search}
        roleFilter={roleFilter}
        statusFilter={statusFilter}
        workspaceRoles={workspaceRoles}
        canDelete={canDelete}
        showDeleted={showDeleted}
        onSearchChange={onSearchChange}
        onRoleFilterChange={onRoleFilterChange}
        onStatusFilterChange={onStatusFilterChange}
        onToggleDeleted={onToggleDeleted}
        onClearSelection={() => onSelectedIdsChange([])}
        columnRegistry={columnRegistry}
        updateUserColumnLayout={updateUserColumnLayout}
        customizerLabels={customizerLabels}
        primaryAction={
          canWrite && !showDeleted ? (
            <div className="flex items-center gap-2">
              <Button type="button" variant="outline" size="sm" onClick={onInviteUser}>
                <UserPlus className="h-3.5 w-3.5" />
                {t('users.invite')}
              </Button>
              <Button type="button" size="sm" onClick={onAddUser}>
                <UserPlus className="h-3.5 w-3.5" />
                {t('users.add')}
              </Button>
            </div>
          ) : undefined
        }
      />

      <UsersBulkActionBar
        selectedIds={selectedIds}
        selectedUsers={selectedUsers}
        showDeleted={showDeleted}
        canDelete={canDelete}
        onMessage={onMessage}
        onBulkDelete={onBulkDelete}
        onBulkRestore={onBulkRestore}
        onClearSelection={() => onSelectedIdsChange([])}
      />

      <ModuleWorkListStateShell
        isError={isError}
        isLoading={isLoading}
        isFetching={isFetching}
        onRetry={() => onRetry?.()}
        errorTitle={t('users.loadFailed')}
        errorHint={t('users.loadFailedHint')}
        viewMode={viewMode}
        skeletonColumnCount={columnRegistry?.length ?? 6}
        useServerWork
        pageData={pageData}
        onPageChange={onPageChange}
        i18nNamespace="users"
        showPagination={users.length > 0}
        loadingLabel={t('common.loading')}
      >
        <UsersListContent
          viewMode={viewMode}
          users={users}
          selectedIds={selectedIds}
          allSelected={allSelected}
          someSelected={someSelected}
          canWrite={canWrite}
          canDelete={canDelete}
          showDeleted={showDeleted}
          search={search}
          roleFilter={roleFilter}
          statusFilter={statusFilter}
          onAddUser={onAddUser}
          onToggleSelect={toggleSelect}
          onToggleAll={toggleAll}
          formatLoginDate={fmtDate}
          onView={onView}
          onEdit={onEdit}
          onDelete={onDelete}
          onRestore={onRestore}
          onResetPassword={onResetPassword}
          getColumnWidth={getColumnWidth}
          onColumnResize={onColumnResize}
          isColumnVisible={isColumnVisible}
        />
      </ModuleWorkListStateShell>
    </div>
  );
}
