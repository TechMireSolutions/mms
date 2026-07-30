import type { JSX } from 'react';
import { workspaceRoleLabel, type WorkspaceRole } from '@mms/shared';
import { FormSelect } from '@/components/ui/FormSelect';
import { ModuleTrashToggle } from '@/components/ui/ModuleTrashToggle';
import { SearchBar } from '@/components/ui/SearchBar';
import { useTranslation } from '@/hooks/useTranslation';

interface UsersListFiltersProps {
  search: string;
  roleFilter: string;
  statusFilter: string;
  workspaceRoles: WorkspaceRole[];
  canDelete: boolean;
  showDeleted: boolean;
  onSearchChange: (value: string) => void;
  onRoleFilterChange: (value: string) => void;
  onStatusFilterChange: (value: string) => void;
  onToggleDeleted?: (next: boolean) => void;
  onClearSelection: () => void;
}

export function UsersListFilters({
  search,
  roleFilter,
  statusFilter,
  workspaceRoles,
  canDelete,
  showDeleted,
  onSearchChange,
  onRoleFilterChange,
  onStatusFilterChange,
  onToggleDeleted,
  onClearSelection,
}: UsersListFiltersProps): JSX.Element {
  const { t } = useTranslation();

  return (
    <div className="flex flex-wrap items-center gap-2">
      <SearchBar
        value={search}
        onChange={onSearchChange}
        placeholder={t('users.searchPlaceholder')}
        className="min-w-[11.25rem] flex-1"
      />
      <FormSelect
        id="role-filter"
        name="role-filter"
        value={roleFilter}
        onChange={onRoleFilterChange}
        options={[
          { value: 'all', label: t('users.filterAllRoles') },
          ...workspaceRoles.map((workspaceRole) => ({
            value: workspaceRole.id,
            label: workspaceRoleLabel(workspaceRole, t),
          })),
        ]}
        aria-label={t('users.filterRole')}
        className="w-auto"
      />
      {!showDeleted ? (
        <FormSelect
          id="status-filter"
          name="status-filter"
          value={statusFilter}
          onChange={onStatusFilterChange}
          options={[
            { value: 'all', label: t('users.filterAllStatuses') },
            { value: 'active', label: t('users.status.active') },
            { value: 'inactive', label: t('users.status.inactive') },
            { value: 'suspended', label: t('users.status.suspended') },
          ]}
          aria-label={t('users.filterStatus')}
          className="w-auto"
        />
      ) : null}

      {canDelete ? (
        <ModuleTrashToggle
          showDeleted={showDeleted}
          onToggle={() => {
            onClearSelection();
            onToggleDeleted?.(!showDeleted);
          }}
          showActiveLabel={t('users.trash.showActive')}
          showDeletedLabel={t('users.trash.showDeleted')}
        />
      ) : null}
    </div>
  );
}
