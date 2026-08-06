import React, { useMemo, useState } from 'react';
import type { SystemUser } from '@mms/shared';
import { useTranslation } from '@/hooks/useTranslation';
import { useWorkDirectoryViewMode } from '@/hooks/useWorkDirectoryViewMode';
import { useGlobalSettings } from '@/tenant/hooks/useGlobalSettings';
import { useWorkspaceRoles } from '@/tenant/hooks/useWorkspaceRoles';
import { formatDate } from '@mms/shared';
import { UsersListContent } from '@/tenant/features/users/components/UsersListContent';
import { UsersListFilters } from '@/tenant/features/users/components/UsersListFilters';
import { UsersListSelectionBar } from '@/tenant/features/users/components/UsersListSelectionBar';
import {
  getDirectoryPageSelection,
  toggleIdInSelection,
  togglePageIdsInSelection,
} from '@/lib/directorySelection';

export interface UsersListProps {
  users: SystemUser[];
  onView: (user: SystemUser) => void;
  onEdit: (user: SystemUser) => void;
  onDelete: (id: string) => void;
  onRestore: (id: string) => void;
  onBulkDelete: (ids: string[]) => void;
  onBulkRestore: (ids: string[]) => void;
  onResetPassword: (user: SystemUser) => void;
  onAddUser: () => void;
  onMessage?: (channel: 'sms' | 'whatsapp' | 'email', users: SystemUser[]) => void;
  canWrite?: boolean;
  canDelete?: boolean;
  showDeleted?: boolean;
  onToggleDeleted?: (next: boolean) => void;
  getColumnWidth?: (key: string) => number | undefined;
  onColumnResize?: (key: string, width: number) => void;
}

export function UsersList({
  users,
  onView,
  onEdit,
  onDelete,
  onRestore,
  onBulkDelete,
  onBulkRestore,
  onResetPassword,
  onAddUser,
  onMessage,
  canWrite = true,
  canDelete = true,
  showDeleted = false,
  onToggleDeleted,
  getColumnWidth,
  onColumnResize,
}: UsersListProps): React.JSX.Element {
  const { viewMode, setViewMode } = useWorkDirectoryViewMode();
  const { t } = useTranslation();
  const globalSettings = useGlobalSettings();
  const workspaceRoles = useWorkspaceRoles();
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatus] = useState('all');
  const [selected, setSelected] = useState<string[]>([]);

  const filtered = useMemo(
    () =>
      users.filter((user) => {
        if (roleFilter !== 'all' && user.role !== roleFilter) return false;
        if (!showDeleted && statusFilter !== 'all' && user.status !== statusFilter) return false;
        if (search) {
          const searchQuery = search.toLowerCase();
          if (!user.name.toLowerCase().includes(searchQuery) && !user.email.toLowerCase().includes(searchQuery)) return false;
        }
        return true;
      }),
    [users, search, roleFilter, statusFilter, showDeleted],
  );

  const pageIds = filtered.map((user) => user.id);
  const { allSelected, someSelected } = getDirectoryPageSelection(pageIds, selected);

  const toggleSelect = (id: string): void =>
    setSelected((selectedIds) => toggleIdInSelection(selectedIds, id));
  const toggleAll = (): void =>
    setSelected((current) => togglePageIdsInSelection(current, pageIds));

  const fmtDate = (ts: string): string => {
    if (!ts) return t('users.never');
    return formatDate(ts, globalSettings.dateFormat, false);
  };

  const selectedUsers = users.filter((user) => selected.includes(user.id));

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
        onSearchChange={setSearch}
        onRoleFilterChange={setRoleFilter}
        onStatusFilterChange={setStatus}
        onToggleDeleted={onToggleDeleted}
        onClearSelection={() => setSelected([])}
      />

      <UsersListSelectionBar
        selectedIds={selected}
        selectedUsers={selectedUsers}
        showDeleted={showDeleted}
        canDelete={canDelete}
        onMessage={onMessage}
        onBulkDelete={onBulkDelete}
        onBulkRestore={onBulkRestore}
        onClearSelection={() => setSelected([])}
      />

      <UsersListContent
        viewMode={viewMode}
        users={filtered}
        selectedIds={selected}
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
      />

      <p className="text-xs text-muted-foreground">
        {t('users.shownCount', { count: filtered.length })}
      </p>
    </div>
  );
}
