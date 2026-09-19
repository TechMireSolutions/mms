import React from "react";
import type { ReactNode } from "react";
import { DirectoryCardMetaGrid } from "@/components/ui/DirectoryCardMetaGrid";
import { DirectoryCardMetaTile } from "@/components/ui/DirectoryCardMetaTile";

export interface DirectoryCardMetadataProps<TColumn extends { label: string }> {
  columns: TColumn[];
  /** Stable tile key per column. */
  keyFor: (col: TColumn) => string;
  /** Localized tile label per column. */
  labelFor: (col: TColumn) => string;
  /** Tile value per column — return null to drop the tile (empty values). */
  renderValue: (col: TColumn) => ReactNode | null;
}

/**
 * Shared Work-directory card metadata grid.
 *
 * Maps visible Work columns to {@link DirectoryCardMetaTile}s inside a
 * {@link DirectoryCardMetaGrid}; columns whose `renderValue` returns null are
 * dropped, and the whole grid is omitted when nothing renders. Person modules
 * (Contacts/Students/Teachers) pass their own column list and value closures,
 * so the mapper chrome stays single-authority.
 */
export const DirectoryCardMetadata = React.memo(function DirectoryCardMetadata<
  TColumn extends { label: string },
>({
  columns,
  keyFor,
  labelFor,
  renderValue,
}: DirectoryCardMetadataProps<TColumn>): React.JSX.Element | null {
  const tiles = columns.map((col) => {
    const value = renderValue(col);
    if (value === null || value === undefined) return null;
    return (
      <DirectoryCardMetaTile key={keyFor(col)} label={labelFor(col)}>
        {value}
      </DirectoryCardMetaTile>
    );
  });

  const hasTiles = tiles.some((tile) => tile !== null);
  if (!hasTiles) return null;

  return <DirectoryCardMetaGrid>{tiles}</DirectoryCardMetaGrid>;
}) as <TColumn extends { label: string }>(
  props: DirectoryCardMetadataProps<TColumn>,
) => React.JSX.Element | null;

