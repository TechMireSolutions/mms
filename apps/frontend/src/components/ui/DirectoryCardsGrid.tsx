import React, { type ReactNode } from "react";
import { EntityCardsGrid } from "@/components/ui/EntityCardsGrid";

export interface DirectoryCardsGridProps {
  children: ReactNode;
  className?: string;
}

/**
 * Backward-compatible alias for unified EntityCardsGrid.
 */
export function DirectoryCardsGrid({
  children,
  className,
}: DirectoryCardsGridProps): React.JSX.Element {
  return (
    <EntityCardsGrid cols={2} className={className}>
      {children}
    </EntityCardsGrid>
  );
}
