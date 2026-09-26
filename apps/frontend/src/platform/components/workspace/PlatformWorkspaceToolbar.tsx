import React from 'react';
import { Globe, Ban, Download, RefreshCw } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import { SubTabBar } from '@/components/ui/SubTabBar';
import { Button } from '@/components/ui/button';
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

      <Button
        variant="outline"
        size="icon"
        onClick={onRefetch}
        disabled={isSearching}
        className="min-h-11 h-11 min-w-11 w-11 rounded-xl border-border/80 hover:bg-muted/80 cursor-pointer"
        title={t('common.refresh')}
        aria-label={t('common.refresh')}
      >
        <RefreshCw className={`w-3.5 h-3.5 ${isSearching ? 'animate-spin' : ''}`} aria-hidden />
      </Button>

      <Button
        variant="outline"
        size="sm"
        onClick={onExportCsv}
        disabled={shownCount === 0}
        className="min-h-11 h-11 px-3.5 text-xs font-bold gap-1.5 rounded-xl border-border/80 hover:bg-muted/80 cursor-pointer"
        title={t('platform.exportWorkspacesCsv')}
      >
        <Download className="w-3.5 h-3.5" aria-hidden />
        {t('platform.exportWorkspacesCsv')}
      </Button>
    </ModuleWorkToolbar>
  );
}
