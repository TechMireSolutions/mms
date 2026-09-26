import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { EntityDescriptor } from "@/types/entityRegistry";
import { getEntityDescriptor } from "@/components/common/entityRegistry";
import { resolveFieldLabel } from "@/components/ui/DirectoryCardMetadata";

export interface FilterChip {
  key: string;
  label: string;
  onRemove: () => void;
}

export interface FilterChipsProps<T = unknown> {
  chips?: FilterChip[];
  /** Optional SSOT descriptor-driven active filters */
  filters?: Record<string, unknown>;
  entityType?: string;
  descriptor?: EntityDescriptor<T>;
  onRemoveFilter?: (fieldKey: string) => void;
  onClearAll?: () => void;
  className?: string;
}

/**
 * FilterChips — shows active filter pills with clear actions.
 * Supports both manual chip arrays and declarative entity descriptor-driven active filter state.
 */
export function FilterChips<T = unknown>({
  chips = [],
  filters,
  entityType,
  descriptor,
  onRemoveFilter,
  onClearAll,
  className,
}: FilterChipsProps<T>): React.ReactElement | null {
  const { t } = useTranslation();

  const effectiveDescriptor = (descriptor ?? (entityType ? getEntityDescriptor(entityType) : undefined)) as
    | EntityDescriptor<unknown>
    | undefined;

  const effectiveChips = React.useMemo(() => {
    const list = [...chips];
    if (filters && effectiveDescriptor) {
      for (const [key, value] of Object.entries(filters)) {
        if (value === undefined || value === null || value === "" || value === "all") continue;
        const field = effectiveDescriptor.getField(key);
        const fieldLabel = field ? resolveFieldLabel(field, t) : key;
        let valueLabel: string;
        try {
          const formatted = effectiveDescriptor.formatFieldValue(key, { [key]: value });
          valueLabel = formatted && formatted !== "—" ? formatted : String(value);
        } catch {
          valueLabel = typeof value === "boolean" ? (value ? "Yes" : "No") : String(value);
        }
        list.push({
          key,
          label: `${fieldLabel}: ${valueLabel}`,
          onRemove: () => onRemoveFilter?.(key),
        });
      }
    }
    return list;
  }, [chips, filters, effectiveDescriptor, onRemoveFilter]);

  if (effectiveChips.length === 0) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: "auto" }}
        exit={{ opacity: 0, height: 0 }}
        className={cn("flex items-center gap-2 flex-wrap", className)}
      >
        {effectiveChips.map((chip) => (
          <button
            key={chip.key}
            type="button"
            onClick={chip.onRemove}
            aria-label={chip.label}
            title={chip.label}
            className="flex min-h-11 items-center gap-1.5 text-xs font-semibold px-2.5 py-2 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer"
          >
            {chip.label}
            <X className="w-3 h-3" aria-hidden="true" />
          </button>
        ))}
        {effectiveChips.length > 1 && onClearAll && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClearAll}
            className="min-h-11 text-xs text-muted-foreground hover:text-foreground underline transition-colors px-2"
          >
            {t("common.clearFilters")}
          </Button>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
