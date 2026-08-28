import React from 'react';
import { Button } from '@/components/ui/button';
import { type ModuleColumnCustomizerProps } from '@/components/ui/ModuleColumnCustomizer';
import { FilterChips } from '@/components/ui/FilterChips';
import { ModuleWorkToolbar } from '@/components/ui/ModuleWorkToolbar';
import type { WorkDirectoryViewMode } from '@/hooks/useWorkDirectoryViewMode';
import { useTranslation } from '@/hooks/useTranslation';
import {
  ExaminationsFiltersMenuButton,
  EXAM_STATUSES,
} from '@/tenant/features/examinations/components/ExaminationsFiltersMenuButton';

export const EXAMINATIONS_WORK_SEARCH_INPUT_ID = 'examinations-work-search';

export interface ExaminationsListFiltersProps {
  viewMode: WorkDirectoryViewMode;
  onViewModeChange: (mode: WorkDirectoryViewMode) => void;
  search: string;
  filterStatus: string[];
  canWrite: boolean;
  canDelete?: boolean;
  showDeleted: boolean;
  onToggleDeleted?: () => void;
  columnCustomizer?: ModuleColumnCustomizerProps;
  statusLabels: Record<(typeof EXAM_STATUSES)[number], string>;
  onSearchChange: (value: string) => void;
  onToggleStatus: (status: string) => void;
  onClearStatuses: () => void;
  onNew: () => void;
}

export function ExaminationsListFilters({
  viewMode,
  onViewModeChange,
  search,
  filterStatus,
  canWrite,
  canDelete = false,
  showDeleted,
  onToggleDeleted,
  columnCustomizer,
  statusLabels,
  onSearchChange,
  onToggleStatus,
  onClearStatuses,
  onNew,
}: ExaminationsListFiltersProps): React.JSX.Element {
  const { t } = useTranslation();

  const clearFilters = (): void => {
    onClearStatuses();
  };

  return (
    <>
      <ModuleWorkToolbar
        regionLabel={t('nav.examinations')}
        search={search}
        onSearchChange={onSearchChange}
        searchPlaceholder={t('examinations.searchExams')}
        searchId={EXAMINATIONS_WORK_SEARCH_INPUT_ID}
        hasActiveFilters={filterStatus.length > 0}
        onClearFilters={clearFilters}
        clearFiltersLabel={t('examinations.clearFilters')}
        filterButton={
          <ExaminationsFiltersMenuButton
            filterStatus={filterStatus}
            activeFilterCount={filterStatus.length}
            statusLabels={statusLabels}
            onToggleStatus={onToggleStatus}
            onClearFilters={clearFilters}
          />
        }
        primaryAction={
          canWrite && !showDeleted ? (
            <Button
              type="button"
              onClick={onNew}
              className="flex min-h-11 items-center gap-1.5 whitespace-nowrap rounded-lg bg-primary px-3.5 py-2 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90"
            >
              {t('examinations.newExam')}
            </Button>
          ) : undefined
        }
        trashToggle={
          canDelete && onToggleDeleted
            ? {
                canViewDeleted: canDelete,
                viewingDeleted: showDeleted,
                onToggle: onToggleDeleted,
                activeLabel: t('examinations.trash.showActive'),
                deletedLabel: t('examinations.trash.showDeleted'),
              }
            : undefined
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
          label: statusLabels[status as (typeof EXAM_STATUSES)[number]],
          onRemove: () => onToggleStatus(status),
        }))}
        onClearAll={clearFilters}
      />
    </>
  );
}
