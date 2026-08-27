import type { JSX } from 'react';
import { workspaceRoleLabel, type ModuleColumnRegistryEntry, type WorkspaceRole } from '@mms/shared';
import { FormSelect } from '@/components/ui/FormSelect';
import { ModuleWorkToolbar } from '@/components/ui/ModuleWorkToolbar';
import { useTranslation } from '@/hooks/useTranslation';
import type { WorkDirectoryViewMode } from '@/hooks/useWorkDirectoryViewMode';
import type { ModuleColumnCustomizerLabels } from '@/components/ui/ModuleColumnCustomizer';
import { USERS_WORK_SEARCH_INPUT_ID } from '@/tenant/features/users/hooks/useUsersKeyboardShortcuts';

interface UsersListFiltersProps {
  viewMode: WorkDirectoryViewMode;
  onViewModeChange: (mode: WorkDirectoryViewMode) => void;
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
  columnRegistry?: ModuleColumnRegistryEntry[];
  updateUserColumnLayout?: (columnRegistry: ModuleColumnRegistryEntry[]) => void;
  customizerLabels?: ModuleColumnCustomizerLabels;
  primaryAction?: React.ReactNode;
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
  viewMode,
  onViewModeChange,
  columnRegistry,
  updateUserColumnLayout,
  customizerLabels,
  primaryAction,
}: UsersListFiltersProps): JSX.Element {
  const { t } = useTranslation();
  const hasActiveFilters = roleFilter !== 'all' || (!showDeleted && statusFilter !== 'all');
  const handleClearFilters = (): void => {
    onRoleFilterChange('all');
    onStatusFilterChange('all');
  };

  return (
    <ModuleWorkToolbar
      regionLabel={t('page.users.title')}
      searchId={USERS_WORK_SEARCH_INPUT_ID}
      search={search}
      onSearchChange={onSearchChange}
      searchPlaceholder={t('users.searchPlaceholder')}
      hasActiveFilters={hasActiveFilters}
      onClearFilters={handleClearFilters}
      clearFiltersLabel={t('common.clearFilters')}
      viewModeToggle={{
        viewMode,
        onViewModeChange,
      }}
      columnCustomizer={
        columnRegistry && updateUserColumnLayout
          ? {
              registry: columnRegistry,
              onUpdate: updateUserColumnLayout,
              labels: customizerLabels,
            }
          : undefined
      }
      trashToggle={
        canDelete
          ? {
              canViewDeleted: true,
              viewingDeleted: showDeleted,
              onToggle: (v) => {
                onClearSelection();
                onToggleDeleted?.(v);
              },
              activeLabel: t('users.trash.showActive'),
              deletedLabel: t('users.trash.showDeleted'),
            }
          : undefined
      }
      primaryAction={primaryAction}
    >
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
        className="w-auto shrink-0"
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
          className="w-auto shrink-0"
        />
      ) : null}
    </ModuleWorkToolbar>
  );
}
