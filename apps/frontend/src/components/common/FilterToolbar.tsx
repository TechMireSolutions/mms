import React from "react";
import { SearchBar } from "@/components/ui/SearchBar";
import { WorkViewModeToggle } from "@/components/ui/WorkViewModeToggle";
import { ModuleTrashToggle } from "@/components/ui/ModuleTrashToggle";
import { cn } from "@/lib/utils";

export interface FilterToolbarProps {
  /** DOM id for the search input to enable `/` or `Cmd+K` keyboard focusing. */
  searchInputId?: string;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  /** Filter menu button / popover trigger component. */
  filterButton?: React.ReactNode;
  /** Active filter chips or badges. */
  filterChips?: React.ReactNode;
  /** View mode ('table' | 'cards') and toggle callback. */
  viewMode?: "table" | "cards";
  onViewModeChange?: (mode: "table" | "cards") => void;
  /** Soft-delete / trash toggle integration. */
  trashToggle?: {
    showDeleted: boolean;
    onToggle: () => void;
    showActiveLabel?: string;
    showDeletedLabel?: string;
  };
  /** Additional action elements (e.g., column customizer, export button). */
  children?: React.ReactNode;
  className?: string;
}

/**
 * Universal FilterToolbar primitive.
 * Combines debounced search input, filter facets/menu, view switcher, and trash toggle.
 */
export function FilterToolbar({
  searchInputId = "module-search-input",
  searchQuery,
  onSearchChange,
  searchPlaceholder,
  filterButton,
  filterChips,
  viewMode,
  onViewModeChange,
  trashToggle,
  children,
  className,
}: FilterToolbarProps): React.JSX.Element {
  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-wrap items-center gap-2">
          <div className="w-full sm:max-w-xs">
            <SearchBar
              id={searchInputId}
              value={searchQuery}
              onChange={onSearchChange}
              placeholder={searchPlaceholder}
            />
          </div>
          {filterButton}
          {children}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {viewMode && onViewModeChange ? (
            <WorkViewModeToggle viewMode={viewMode} onViewModeChange={onViewModeChange} />
          ) : null}
          {trashToggle ? (
            <ModuleTrashToggle
              showDeleted={trashToggle.showDeleted}
              onToggle={trashToggle.onToggle}
              showActiveLabel={trashToggle.showActiveLabel ?? "Active"}
              showDeletedLabel={trashToggle.showDeletedLabel ?? "Trash"}
            />
          ) : null}
        </div>
      </div>

      {filterChips ? (
        <div className="flex flex-wrap items-center gap-1.5">{filterChips}</div>
      ) : null}
    </div>
  );
}
