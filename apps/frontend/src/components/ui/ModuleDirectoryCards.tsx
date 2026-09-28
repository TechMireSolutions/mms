import React, { type ReactNode } from "react";
import { EntityCardsGrid } from "@/components/ui/EntityCardsGrid";

export interface ModuleDirectoryCardsProps<T> {
  items: T[];
  renderItem: (item: T) => ReactNode;
  selectedIds: (string | number)[];
  onSelectAll?: () => void;
  allSelected?: boolean;
  someSelected?: boolean;
  selectAllLabel?: string;
  deselectAllLabel?: string;
  selectedCountLabel?: ReactNode;
  pageCountLabel?: ReactNode;
  checkboxIdPrefix?: string;
}

/**
 * Backward-compatible wrapper delegating to unified EntityCardsGrid.
 */
export function ModuleDirectoryCards<T>(props: ModuleDirectoryCardsProps<T>): React.JSX.Element {
  return <EntityCardsGrid<T> cols={2} {...props} />;
}
