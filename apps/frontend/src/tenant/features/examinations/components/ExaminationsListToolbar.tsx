import type { JSX } from 'react';
import { Button } from '@/components/ui/button';
import { ModuleColumnCustomizer, type ModuleColumnCustomizerProps } from '@/components/ui/ModuleColumnCustomizer';
import { ModuleClearFiltersButton } from '@/components/ui/ModuleClearFiltersButton';
import { FilterChips } from '@/components/ui/FilterChips';
import { SearchBar } from '@/components/ui/SearchBar';
import { WorkViewModeToggle } from '@/components/ui/WorkViewModeToggle';
import { WORK_SURFACE } from '@/components/ui/formStyles';
import type { WorkDirectoryViewMode } from '@/hooks/useWorkDirectoryViewMode';
import { useTranslation } from '@/hooks/useTranslation';
import { cn } from '@/lib/utils';
import { ExaminationsFiltersMenuButton } from '@/tenant/features/examinations/components/ExaminationsFiltersMenuButton';

const EXAM_STATUSES = ['upcoming', 'ongoing', 'completed', 'scheduled', 'cancelled'] as const;

export const EXAMINATIONS_WORK_SEARCH_INPUT_ID = 'examinations-work-search';

interface ExaminationsListToolbarProps {
  viewMode: WorkDirectoryViewMode;
  onViewModeChange: (mode: WorkDirectoryViewMode) => void;
  search: string;
  filterStatus: string[];
  canWrite: boolean;
  showDeleted: boolean;
  columnCustomizer?: ModuleColumnCustomizerProps;
  statusLabels: Record<(typeof EXAM_STATUSES)[number], string>;
  onSearchChange: (value: string) => void;
  onToggleStatus: (status: string) => void;
  onClearStatuses: () => void;
  onNew: () => void;
}

export function ExaminationsListToolbar({
  viewMode,
  onViewModeChange,
  search,
  filterStatus,
  canWrite,
  showDeleted,
  columnCustomizer,
  statusLabels,
  onSearchChange,
  onToggleStatus,
  onClearStatuses,
  onNew,
}: ExaminationsListToolbarProps): JSX.Element {
  const { t } = useTranslation();

  const clearFilters = (): void => {
    onClearStatuses();
  };

  return (
    <>
      <div className={cn(WORK_SURFACE, 'flex flex-col gap-3 p-3 sm:flex-row')}>
        <div className="relative min-w-0 flex-1">
          <SearchBar
            id={EXAMINATIONS_WORK_SEARCH_INPUT_ID}
            value={search}
            onChange={onSearchChange}
            placeholder={t('examinations.searchExams')}
            className="w-full min-w-0"
          />
          <div className="pointer-events-none absolute end-3 top-1/2 hidden -translate-y-1/2 items-center gap-1 md:flex">
            <kbd className="rounded border border-border/60 bg-muted/60 px-1.5 py-0.5 font-mono text-xs font-medium text-muted-foreground">
              /
            </kbd>
          </div>
        </div>

        <div className="flex max-w-full flex-wrap items-center gap-2 sm:flex-nowrap sm:overflow-x-auto">
          <ExaminationsFiltersMenuButton
            filterStatus={filterStatus}
            activeFilterCount={filterStatus.length}
            statusLabels={statusLabels}
            onToggleStatus={onToggleStatus}
            onClearFilters={clearFilters}
          />

          {filterStatus.length > 0 ? (
            <ModuleClearFiltersButton
              onClearFilters={clearFilters}
              label={t('examinations.clearFilters')}
            />
          ) : null}

          {canWrite && !showDeleted && (
            <Button
              type="button"
              onClick={onNew}
              className="flex min-h-11 items-center gap-1.5 whitespace-nowrap rounded-lg bg-primary px-3.5 py-2 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90"
            >
              {t('examinations.newExam')}
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
          label: statusLabels[status as (typeof EXAM_STATUSES)[number]],
          onRemove: () => onToggleStatus(status),
        }))}
        onClearAll={clearFilters}
      />
    </>
  );
}
