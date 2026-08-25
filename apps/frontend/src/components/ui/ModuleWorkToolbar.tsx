import React, { type JSX } from "react";
import { SearchBar } from "@/components/ui/SearchBar";
import { ModuleClearFiltersButton } from "@/components/ui/ModuleClearFiltersButton";
import { ModuleTrashToggle } from "@/components/ui/ModuleTrashToggle";
import { WorkViewModeToggle } from "@/components/ui/WorkViewModeToggle";
import { ModuleColumnCustomizer, type ModuleColumnCustomizerLabels } from "@/components/ui/ModuleColumnCustomizer";
import { WORK_SURFACE } from "@/components/ui/formStyles";
import type { WorkDirectoryViewMode } from "@/hooks/useWorkDirectoryViewMode";
import { cn } from "@/lib/utils";

export interface ModuleWorkToolbarProps {
  // 1. Accessibility & Layout
  shownCountLabel?: string;
  regionLabel: string;
  
  // 2. Search
  search: string;
  onSearchChange: (val: string) => void;
  searchPlaceholder: string;
  searchId?: string;

  // 3. Middle Area (Filters)
  filterButton?: React.ReactNode; 
  hasActiveFilters?: boolean;
  onClearFilters?: () => void;
  clearFiltersLabel?: string;
  
  primaryAction?: React.ReactNode;

  // 4. Standard Toggles
  trashToggle?: {
    canViewDeleted: boolean;
    viewingDeleted: boolean;
    onToggle: (v: boolean) => void;
    activeLabel: string;
    deletedLabel: string;
  };
  
  viewModeToggle?: {
    viewMode: WorkDirectoryViewMode;
    onViewModeChange: (m: WorkDirectoryViewMode) => void;
  };
  
  columnCustomizer?: {
    registry: any[];
    onUpdate: (layout: any[]) => void;
    onReset?: () => void;
    labels?: ModuleColumnCustomizerLabels;
  };

  // 5. Additional custom buttons
  children?: React.ReactNode; 
}

export function ModuleWorkToolbar({
  shownCountLabel,
  regionLabel,
  search,
  onSearchChange,
  searchPlaceholder,
  searchId,
  filterButton,
  hasActiveFilters,
  onClearFilters,
  clearFiltersLabel,
  primaryAction,
  trashToggle,
  viewModeToggle,
  columnCustomizer,
  children,
}: ModuleWorkToolbarProps): JSX.Element {
  return (
    <>
      {shownCountLabel ? (
        <div className="sr-only" role="status" aria-live="polite">
          {shownCountLabel}
        </div>
      ) : null}

      <div
        role="region"
        aria-label={regionLabel}
        className={cn(WORK_SURFACE, "flex flex-col sm:flex-row gap-3 p-3")}
      >
        <div className="relative min-w-0 flex-1">
          <SearchBar
            id={searchId}
            value={search}
            onChange={onSearchChange}
            placeholder={searchPlaceholder}
            className="w-full min-w-0"
          />
          <div className="pointer-events-none absolute end-3 top-1/2 hidden -translate-y-1/2 items-center gap-1 md:flex">
            <kbd className="rounded border border-border/60 bg-muted/60 px-1.5 py-0.5 font-mono text-xs font-medium text-muted-foreground">
              /
            </kbd>
          </div>
        </div>

        <div className="flex max-w-full flex-wrap items-center gap-2 sm:flex-nowrap sm:overflow-x-auto">
          {children}

          {filterButton}

          {hasActiveFilters && onClearFilters && clearFiltersLabel && (
            <ModuleClearFiltersButton
              onClearFilters={onClearFilters}
              label={clearFiltersLabel}
            />
          )}

          {primaryAction}

          {trashToggle?.canViewDeleted && (
            <ModuleTrashToggle
              showDeleted={trashToggle.viewingDeleted}
              onToggle={() => trashToggle.onToggle(!trashToggle.viewingDeleted)}
              showActiveLabel={trashToggle.activeLabel}
              showDeletedLabel={trashToggle.deletedLabel}
            />
          )}

          {viewModeToggle && (
            <WorkViewModeToggle
              viewMode={viewModeToggle.viewMode}
              onViewModeChange={viewModeToggle.onViewModeChange}
            />
          )}

          {columnCustomizer && columnCustomizer.registry && (
            <ModuleColumnCustomizer
              columnRegistry={columnCustomizer.registry}
              updateUserColumnLayout={columnCustomizer.onUpdate}
              onResetLayout={columnCustomizer.onReset}
              labels={columnCustomizer.labels as ModuleColumnCustomizerLabels}
            />
          )}
        </div>
      </div>
    </>
  );
}
