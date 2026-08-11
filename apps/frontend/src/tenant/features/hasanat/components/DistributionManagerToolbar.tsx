import type { JSX } from 'react';
import { Button } from '@/components/ui/button';
import { FilterChips } from '@/components/ui/FilterChips';
import { ModuleClearFiltersButton } from '@/components/ui/ModuleClearFiltersButton';
import { ModuleColumnCustomizer, type ModuleColumnCustomizerProps } from '@/components/ui/ModuleColumnCustomizer';
import { SearchBar } from '@/components/ui/SearchBar';
import { WorkViewModeToggle } from '@/components/ui/WorkViewModeToggle';
import { WORK_SURFACE } from '@/components/ui/formStyles';
import type { WorkDirectoryViewMode } from '@/hooks/useWorkDirectoryViewMode';
import { useTranslation } from '@/hooks/useTranslation';
import { cn } from '@/lib/utils';
import type { Distribution } from '@/lib/data/hasanatData';
import { HasanatFiltersMenuButton } from '@/tenant/features/hasanat/components/HasanatFiltersMenuButton';

type DistributionStatus = Distribution['status'];

export const HASANAT_WORK_SEARCH_INPUT_ID = 'hasanat-work-search';

interface DistributionManagerToolbarProps {
  viewMode: WorkDirectoryViewMode;
  onViewModeChange: (mode: WorkDirectoryViewMode) => void;
  search: string;
  filterStatus: DistributionStatus[];
  statusLabels: Record<DistributionStatus, string>;
  canWrite: boolean;
  showDeleted: boolean;
  columnCustomizer?: ModuleColumnCustomizerProps;
  onSearchChange: (value: string) => void;
  onToggleStatus: (status: DistributionStatus) => void;
  onClearStatuses: () => void;
  onOpenModal: () => void;
}

export function DistributionManagerToolbar({
  viewMode,
  onViewModeChange,
  search,
  filterStatus,
  statusLabels,
  canWrite,
  showDeleted,
  columnCustomizer,
  onSearchChange,
  onToggleStatus,
  onClearStatuses,
  onOpenModal,
}: DistributionManagerToolbarProps): JSX.Element {
  const { t } = useTranslation();

  return (
    <>
      <div className={cn(WORK_SURFACE, 'flex flex-col gap-3 p-3 sm:flex-row')}>
        <div className="relative min-w-0 flex-1">
          <SearchBar
            id={HASANAT_WORK_SEARCH_INPUT_ID}
            value={search}
            onChange={onSearchChange}
            placeholder={t('hasanat.searchDistributions')}
            className="w-full min-w-0"
          />
          <div className="pointer-events-none absolute end-3 top-1/2 hidden -translate-y-1/2 items-center gap-1 md:flex">
            <kbd className="rounded border border-border/60 bg-muted/60 px-1.5 py-0.5 font-mono text-xs font-medium text-muted-foreground">
              /
            </kbd>
          </div>
        </div>

        <div className="flex max-w-full flex-wrap items-center gap-2 sm:flex-nowrap sm:overflow-x-auto">
          <HasanatFiltersMenuButton
            filterStatus={filterStatus}
            activeFilterCount={filterStatus.length}
            statusLabels={statusLabels}
            onToggleStatus={onToggleStatus}
            onClearFilters={onClearStatuses}
          />

          {filterStatus.length > 0 ? (
            <ModuleClearFiltersButton
              onClearFilters={onClearStatuses}
              label={t('hasanat.clearFilters')}
            />
          ) : null}

          {canWrite && !showDeleted && (
            <Button
              type="button"
              onClick={onOpenModal}
              className="flex min-h-11 items-center gap-1.5 whitespace-nowrap rounded-lg bg-primary px-3.5 py-2 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90"
            >
              {t('hasanat.distributeCards')}
            </Button>
          )}

          <WorkViewModeToggle viewMode={viewMode} onViewModeChange={onViewModeChange} />

          {columnCustomizer && (
            <ModuleColumnCustomizer
              columnRegistry={columnCustomizer.columnRegistry}
              updateUserColumnLayout={columnCustomizer.updateUserColumnLayout}
              labels={columnCustomizer.labels}
            />
          )}
        </div>
      </div>

      <FilterChips
        chips={filterStatus.map((status) => ({
          key: `status:${status}`,
          label: statusLabels[status],
          onRemove: () => onToggleStatus(status),
        }))}
        onClearAll={onClearStatuses}
      />
    </>
  );
}
