import React from "react";
import type { ReactNode } from "react";
import { DirectoryCardMetaGrid } from "@/components/ui/DirectoryCardMetaGrid";
import { DirectoryCardMetaTile } from "@/components/ui/DirectoryCardMetaTile";
import type { EntityDescriptor } from "@/types/entityRegistry";
import { getEntityDescriptor } from "@/components/common/entityRegistry";

export interface DirectoryCardMetadataProps<
  TColumn extends { label: string } = { label: string },
  TEntity = unknown,
> {
  columns?: TColumn[];
  /** Stable tile key per column. */
  keyFor?: (col: TColumn) => string;
  /** Localized tile label per column. */
  labelFor?: (col: TColumn) => string;
  /** Tile value per column — return null to drop the tile (empty values). */
  renderValue?: (col: TColumn) => ReactNode | null;
  /** Entity domain type name to look up in declarative SSOT registry (e.g. 'contacts', 'students') */
  entityType?: string;
  /** Declarative SSOT entity descriptor (falls back to entityType lookup if omitted) */
  descriptor?: EntityDescriptor<TEntity>;
  /** Entity instance to render when descriptor or entityType is provided */
  entity?: TEntity;
  /** Optional filter to only show tiles for columns enabled in user's layout */
  visibleColumnIds?: string[];
}

/**
 * Shared Work-directory card metadata grid.
 *
 * Supports both declarative {@link EntityDescriptor} rendering and legacy column lists.
 * Maps attributes to {@link DirectoryCardMetaTile}s inside a {@link DirectoryCardMetaGrid}.
 */
export const DirectoryCardMetadata = React.memo(function DirectoryCardMetadata<
  TColumn extends { label: string } = { label: string },
  TEntity = unknown,
>({
  columns,
  keyFor,
  labelFor,
  renderValue,
  entityType,
  descriptor,
  entity,
  visibleColumnIds,
}: DirectoryCardMetadataProps<TColumn, TEntity>): React.JSX.Element | null {
  const effectiveDescriptor = (descriptor ?? (entityType ? getEntityDescriptor<TEntity>(entityType) : undefined)) as EntityDescriptor<TEntity> | undefined;

  if (effectiveDescriptor && entity) {
    const cardFields = effectiveDescriptor.getCardFields().filter((field) => {
      if (!visibleColumnIds || visibleColumnIds.length === 0) return true;
      return visibleColumnIds.includes(field.key);
    });

    const tiles = cardFields.map((field) => {
      const value = effectiveDescriptor.renderFieldValue(field.key, entity);
      if (value === null || value === undefined) return null;
      return (
        <DirectoryCardMetaTile key={field.key} label={field.label}>
          {value}
        </DirectoryCardMetaTile>
      );
    });

    const hasTiles = tiles.some((tile) => tile !== null);
    if (!hasTiles) return null;

    return <DirectoryCardMetaGrid>{tiles}</DirectoryCardMetaGrid>;
  }

  if (!columns || !keyFor || !labelFor || !renderValue) {
    return null;
  }

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
}) as <TColumn extends { label: string } = { label: string }, TEntity = unknown>(
  props: DirectoryCardMetadataProps<TColumn, TEntity>,
) => React.JSX.Element | null;
