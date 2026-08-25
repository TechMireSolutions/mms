import { Button } from '@/components/ui/button';
import { FilterChips } from '@/components/ui/FilterChips';
import { type ModuleColumnCustomizerProps } from '@/components/ui/ModuleColumnCustomizer';
import { ModuleWorkToolbar } from "@/components/ui/ModuleWorkToolbar";
import type { WorkDirectoryViewMode } from '@/hooks/useWorkDirectoryViewMode';
import { useTranslation } from '@/hooks/useTranslation';
import type { Distribution } from '@/lib/data/hasanatData';
import { HasanatFiltersMenuButton } from '@/tenant/features/hasanat/components/HasanatFiltersMenuButton';

type DistributionStatus = Distribution['status'];

export const HASANAT_WORK_SEARCH_INPUT_ID = 'hasanat-work-search';

interface DistributionManagerListFiltersProps {
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

export function DistributionManagerListFilters({
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
}: DistributionManagerListFiltersProps): JSX.Element {
  const { t } = useTranslation();

  return (
    <>
      <ModuleWorkToolbar
        regionLabel={t('hasanat.tabs.distribute')}
        search={search}
        onSearchChange={onSearchChange}
        searchPlaceholder={t('hasanat.searchDistributions')}
        searchId={HASANAT_WORK_SEARCH_INPUT_ID}
        hasActiveFilters={filterStatus.length > 0}
        onClearFilters={onClearStatuses}
        clearFiltersLabel={t('hasanat.clearFilters')}
        filterButton={
          <HasanatFiltersMenuButton
            filterStatus={filterStatus}
            activeFilterCount={filterStatus.length}
            statusLabels={statusLabels}
            onToggleStatus={onToggleStatus}
            onClearFilters={onClearStatuses}
          />
        }
        primaryAction={
          canWrite && !showDeleted ? (
            <Button
              type="button"
              onClick={onOpenModal}
              className="flex min-h-11 items-center gap-1.5 whitespace-nowrap rounded-lg bg-primary px-3.5 py-2 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90"
            >
              {t('hasanat.distributeCards')}
            </Button>
          ) : undefined
        }
        viewModeToggle={{
          viewMode,
          onViewModeChange,
        }}
        columnCustomizer={columnCustomizer ? {
          registry: columnCustomizer.columnRegistry,
          onUpdate: columnCustomizer.updateUserColumnLayout,
          onReset: columnCustomizer.onResetLayout,
          labels: columnCustomizer.labels,
        } : undefined}
      />

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
