import React, { type JSX } from "react";
import type { ModuleColumnRegistryEntry } from "@mms/shared";
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
  isSearching?: boolean;

  // 3. Middle Area (Filters)
  filterButton?: React.ReactNode; 
  hasActiveFilters?: boolean;
  onClearFilters?: () => void;
  clearFiltersLabel?: string;
  filterChips?: React.ReactNode;
  
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
    registry: ModuleColumnRegistryEntry[];
    onUpdate: (layout: ModuleColumnRegistryEntry[]) => void;
    onReset?: () => void;
    labels?: Partial<ModuleColumnCustomizerLabels>;
    disabled?: boolean;
    className?: string;
  };

  // 5. Additional custom slot
  children?: React.ReactNode; 
}

export const ModuleWorkToolbar = (function ModuleWorkToolbar({
  shownCountLabel,
  regionLabel,
  search,
  onSearchChange,
  searchPlaceholder,
  searchId,
  isSearching,
  filterButton,
  hasActiveFilters,
  onClearFilters,
  clearFiltersLabel,
  filterChips,
  primaryAction,
  trashToggle,
  viewModeToggle,
  columnCustomizer,
  children,
}: ModuleWorkToolbarProps): JSX.Element {
  const hasFilterControls = Boolean(
    children || filterButton || (hasActiveFilters && onClearFilters) || primaryAction || trashToggle?.canViewDeleted,
  );
  const hasLayoutControls = Boolean(
    viewModeToggle || (columnCustomizer && columnCustomizer.registry?.length),
  );

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
        className={cn(
          WORK_SURFACE,
          "flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-2.5 p-2.5 sm:p-3",
        )}
      >
        <div className="relative min-w-0 flex-1 w-full lg:max-w-md xl:max-w-lg">
          <SearchBar
            id={searchId}
            value={search}
            onChange={onSearchChange}
            placeholder={searchPlaceholder}
            isSearching={isSearching}
            className="w-full min-w-0"
          />
          {!search && (
            <button
              type="button"
              tabIndex={-1}
              onClick={() => {
                const el = searchId ? document.getElementById(searchId) : null;
                el?.focus();
              }}
              aria-hidden="true"
              className="absolute end-3 top-1/2 hidden -translate-y-1/2 items-center gap-1 md:flex cursor-pointer select-none"
            >
              <kbd className="rounded border border-border/60 bg-muted/60 px-1.5 py-0.5 font-mono text-3xs font-medium text-muted-foreground shadow-2xs">
                /
              </kbd>
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-start sm:justify-end gap-2 shrink-0">
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

          {hasFilterControls && hasLayoutControls && (
            <div className="h-6 w-px bg-border/60 mx-0.5 hidden sm:block" aria-hidden="true" />
          )}

          {hasLayoutControls && (
            <div className="inline-flex items-center gap-2">
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
                  labels={columnCustomizer.labels}
                  disabled={columnCustomizer.disabled}
                  className={columnCustomizer.className}
                />
              )}
            </div>
          )}
        </div>
      </div>

      {filterChips}
    </>
  );
});
