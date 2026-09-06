import React, { type JSX } from "react";
import type { ModuleColumnRegistryEntry } from "@mms/shared";
import { ModuleWorkToolbar } from "@/components/ui/ModuleWorkToolbar";
import type { ModuleColumnCustomizerLabels } from "@/components/ui/ModuleColumnCustomizer";
import type { WorkDirectoryViewMode } from "@/hooks/useWorkDirectoryViewMode";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "lucide-react";
import { cn } from "@/lib/utils";

export interface WorkTaskStatusOption {
  id: string;
  label: string;
  count?: number;
  badgeCls?: string;
}

export interface WorkTaskToolbarProps {
  // Accessibility & Regions
  regionLabel: string;
  shownCountLabel?: string;

  // Search
  search: string;
  onSearchChange: (val: string) => void;
  searchPlaceholder: string;
  searchId?: string;
  isSearching?: boolean;

  // Status Filter Pills (optional quick filters)
  statusFilter?: {
    activeIds: string[];
    options: WorkTaskStatusOption[];
    onToggle: (id: string) => void;
    allLabel?: string;
    onResetAll?: () => void;
  };

  // Date Range Controls (optional)
  dateRange?: {
    startDate?: string;
    endDate?: string;
    onDateRangeChange: (range: { start?: string; end?: string }) => void;
    startPlaceholder?: string;
    endPlaceholder?: string;
  };

  // Custom filter menu/button slot
  filterButton?: React.ReactNode;
  hasActiveFilters?: boolean;
  onClearFilters?: () => void;
  clearFiltersLabel?: string;
  filterChips?: React.ReactNode;

  // Layout & directory toggles
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

  // Action slots
  primaryAction?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}

/**
 * Universal WorkTaskToolbar primitive.
 * Standardizes operational toolbars with debounced search, status pill toggles,
 * date-range controls, view-mode switching, and column customization.
 */
export function WorkTaskToolbar({
  regionLabel,
  shownCountLabel,
  search,
  onSearchChange,
  searchPlaceholder,
  searchId,
  isSearching,
  statusFilter,
  dateRange,
  filterButton,
  hasActiveFilters,
  onClearFilters,
  clearFiltersLabel,
  filterChips,
  trashToggle,
  viewModeToggle,
  columnCustomizer,
  primaryAction,
  children,
}: WorkTaskToolbarProps): JSX.Element {
  const hasMiddleContent = Boolean(statusFilter || dateRange || children);

  return (
    <div className="space-y-2.5">
      <ModuleWorkToolbar
        regionLabel={regionLabel}
        shownCountLabel={shownCountLabel}
        search={search}
        onSearchChange={onSearchChange}
        searchPlaceholder={searchPlaceholder}
        searchId={searchId}
        isSearching={isSearching}
        filterButton={filterButton}
        hasActiveFilters={hasActiveFilters}
        onClearFilters={onClearFilters}
        clearFiltersLabel={clearFiltersLabel}
        filterChips={filterChips}
        trashToggle={trashToggle}
        viewModeToggle={viewModeToggle}
        columnCustomizer={columnCustomizer}
        primaryAction={primaryAction}
      >
        {children}
      </ModuleWorkToolbar>

      {hasMiddleContent && (statusFilter || dateRange) && (
        <div className="flex flex-wrap items-center justify-between gap-2 px-1">
          {statusFilter && statusFilter.options.length > 0 && (
            <div
              role="group"
              aria-label="Status filters"
              className="flex flex-wrap items-center gap-1.5"
            >
              {statusFilter.allLabel && statusFilter.onResetAll && (
                <Button
                  type="button"
                  variant={statusFilter.activeIds.length === 0 ? "secondary" : "ghost"}
                  size="sm"
                  onClick={statusFilter.onResetAll}
                  className="h-8 px-2.5 text-xs font-medium"
                >
                  {statusFilter.allLabel}
                </Button>
              )}
              {statusFilter.options.map((option) => {
                const isActive = statusFilter.activeIds.includes(option.id);
                return (
                  <Button
                    key={option.id}
                    type="button"
                    variant={isActive ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => statusFilter.onToggle(option.id)}
                    className={cn(
                      "h-8 gap-1.5 px-2.5 text-xs font-medium transition-colors",
                      isActive && "bg-accent font-semibold text-accent-foreground",
                    )}
                  >
                    <span>{option.label}</span>
                    {option.count != null && (
                      <Badge
                        variant="secondary"
                        className={cn(
                          "h-5 min-w-5 px-1 text-[10px] font-normal leading-none",
                          option.badgeCls,
                        )}
                      >
                        {option.count}
                      </Badge>
                    )}
                  </Button>
                );
              })}
            </div>
          )}

          {dateRange && (
            <div className="flex items-center gap-2 text-xs">
              <span className="flex items-center gap-1 text-muted-foreground">
                <Calendar className="h-3.5 w-3.5" aria-hidden="true" />
              </span>
              <input
                type="date"
                value={dateRange.startDate ?? ""}
                onChange={(e) =>
                  dateRange.onDateRangeChange({
                    start: e.target.value || undefined,
                    end: dateRange.endDate,
                  })
                }
                placeholder={dateRange.startPlaceholder}
                className="h-8 rounded-md border border-input bg-background px-2 py-1 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                aria-label={dateRange.startPlaceholder ?? "Start date"}
              />
              <span className="text-muted-foreground">–</span>
              <input
                type="date"
                value={dateRange.endDate ?? ""}
                onChange={(e) =>
                  dateRange.onDateRangeChange({
                    start: dateRange.startDate,
                    end: e.target.value || undefined,
                  })
                }
                placeholder={dateRange.endPlaceholder}
                className="h-8 rounded-md border border-input bg-background px-2 py-1 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                aria-label={dateRange.endPlaceholder ?? "End date"}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
