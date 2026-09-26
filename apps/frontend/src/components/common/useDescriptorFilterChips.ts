import { useMemo } from "react";
import type { EntityDescriptor, FieldDefinition } from "@/types/entityRegistry";
import type { FilterChip } from "@/components/ui/FilterChips";

/**
 * Derives a stable `FilterChip[]` array from an SSOT entity descriptor and
 * an active filter state map.
 *
 * Only fields with `type === "badge" | "status"` that have a `badgeVariantMap`
 * and whose key appears in `filters` with a non-nullish value are included.
 *
 * @param descriptor - i18n-resolved EntityDescriptor for the entity (e.g. from use*EntityDescriptor())
 * @param filters    - The current active filter state (key → filter value)
 * @param onRemove   - Called with the field key when a chip's × button is clicked
 *
 * @example
 * const chips = useDescriptorFilterChips(descriptor, activeFilters, (key) =>
 *   setFilters((prev) => ({ ...prev, [key]: undefined }))
 * );
 */
export function useDescriptorFilterChips<TEntity>(
  descriptor: EntityDescriptor<TEntity> | undefined,
  filters: Record<string, unknown>,
  onRemove: (fieldKey: string) => void,
): FilterChip[] {
  return useMemo(() => {
    if (!descriptor) return [];

    const chips: FilterChip[] = [];

    for (const field of descriptor.fields) {
      if (!isFilterableField(field)) continue;

      const value = filters[field.key];
      if (value === undefined || value === null || value === "") continue;

      const stringValue = String(value);
      const badgeConfig = field.badgeVariantMap?.[stringValue];

      const label = badgeConfig?.label
        ? `${field.label}: ${badgeConfig.label}`
        : `${field.label}: ${stringValue}`;

      chips.push({
        key: field.key,
        label,
        onRemove: () => onRemove(field.key),
      });
    }

    return chips;
  }, [descriptor, filters, onRemove]);
}

/** Fields eligible for chip generation: badge/status types with a badgeVariantMap. */
function isFilterableField<T>(field: FieldDefinition<T>): boolean {
  if (field.filterable !== undefined) return field.filterable;
  return (
    (field.type === "badge" || field.type === "status") &&
    field.badgeVariantMap !== undefined
  );
}
