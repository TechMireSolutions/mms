import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import { Button } from "@/components/ui/button";

export interface FilterChip {
  key: string;
  label: string;
  onRemove: () => void;
}

interface FilterChipsProps {
  chips?: FilterChip[];
  onClearAll?: () => void;
}

/**
 * FilterChips — shows active filter pills with clear actions.
 *
 * @param {FilterChipsProps} props - The component props.
 * @returns {React.ReactElement | null} The rendered filter chips or null.
 */
export function FilterChips({
  chips = [],
  onClearAll,
}: FilterChipsProps): React.ReactElement | null {
  const { t } = useTranslation();
  if (chips.length === 0) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: "auto" }}
        exit={{ opacity: 0, height: 0 }}
        className="flex items-center gap-2 flex-wrap"
      >
        {chips.map((chip) => (
          <button
            key={chip.key}
            type="button"
            onClick={chip.onRemove}
            aria-label={chip.label}
            className="flex min-h-11 items-center gap-1.5 text-xs font-semibold px-2.5 py-2 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer"
          >
            {chip.label}
            <X className="w-3 h-3" aria-hidden="true" />
          </button>
        ))}
        {chips.length > 1 && onClearAll && (
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
