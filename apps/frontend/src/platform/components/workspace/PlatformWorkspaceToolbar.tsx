import React from 'react';
import { Globe, Ban, Download, RefreshCw } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import { SubTabBar } from '@/components/ui/SubTabBar';
import { ActionButton } from '@/components/ui/ActionButton';
import { ModuleWorkToolbar } from '@/components/ui/ModuleWorkToolbar';
import { PlatformWorkspaceSortMenu } from '@/platform/components/PlatformWorkspaceSortMenu';
import type { WorkspaceSortDirection, WorkspaceSortField } from '@/platform/components/platformWorkspaceListData';

export interface PlatformWorkspaceToolbarProps {
  shownCount: number;
  totalCount: number;
  activeCount: number;
  inactiveCount: number;
  search: string;
  onSearchChange: (search: string) => void;
  isSearching: boolean;
  hasActiveFilters: boolean;
  onClearFilters: () => void;
  viewMode: 'table' | 'cards';
  onViewModeChange: (viewMode: 'table' | 'cards') => void;
  statusFilter: 'all' | 'active' | 'inactive';
  onStatusFilterChange: (status: 'all' | 'active' | 'inactive') => void;
  sortField: WorkspaceSortField;
  sortDirection: WorkspaceSortDirection;
  onToggleSort: (field: WorkspaceSortField) => void;
  onRefetch: () => void;
  onExportCsv: () => void;
}

export function PlatformWorkspaceToolbar({
  shownCount,
  totalCount,
  activeCount,
  inactiveCount,
  search,
  onSearchChange,
  isSearching,
  hasActiveFilters,
  onClearFilters,
  viewMode,
  onViewModeChange,
  statusFilter,
  onStatusFilterChange,
  sortField,
  sortDirection,
  onToggleSort,
  onRefetch,
  onExportCsv,
}: PlatformWorkspaceToolbarProps): React.JSX.Element {
  const { t } = useTranslation();

  return (
    <ModuleWorkToolbar
      regionLabel={t('platform.manageMadrasas')}
      shownCountLabel={`${shownCount} of ${totalCount}`}
      search={search}
      onSearchChange={onSearchChange}
      searchPlaceholder={t('common.search')}
      searchId="platform-workspaces-search"
      isSearching={isSearching}
      hasActiveFilters={hasActiveFilters}
      onClearFilters={onClearFilters}
      clearFiltersLabel={t('common.clearFilters')}
      viewModeToggle={{
        viewMode,
        onViewModeChange,
      }}
    >
      <SubTabBar
        tabs={[
          { key: 'all', label: `${t('platform.filterAll')} (${totalCount})` },
          { key: 'active', label: `${t('platform.workspaceActive')} (${activeCount})`, icon: Globe },
          { key: 'inactive', label: `${t('platform.workspaceInactive')} (${inactiveCount})`, icon: Ban },
        ]}
        value={statusFilter}
        onChange={onStatusFilterChange}
      />

      <PlatformWorkspaceSortMenu
        sortField={sortField}
        sortDirection={sortDirection}
        onToggleSort={onToggleSort}
      />

      <ActionButton
        variant="secondary"
        size="sm"
        icon={RefreshCw}
        loading={isSearching}
        onClick={onRefetch}
        className="min-w-11"
        title={t('common.refresh')}
        aria-label={t('common.refresh')}
      />

      <ActionButton
        variant="secondary"
        icon={Download}
        onClick={onExportCsv}
        disabled={shownCount === 0}
        title={t('platform.exportWorkspacesCsv')}
      >
        {t('platform.exportWorkspacesCsv')}
      </ActionButton>
    </ModuleWorkToolbar>
  );
}
