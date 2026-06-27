import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

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
  if (chips.length === 0) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: "auto" }}
        exit={{ opacity: 0, height: 0 }}
        className="flex items-center gap-2 flex-wrap overflow-hidden"
      >
        {chips.map((chip) => (
          <button
            key={chip.key}
            onClick={chip.onRemove}
            className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
          >
            {chip.label}
            <X className="w-3 h-3" />
          </button>
        ))}
        {chips.length > 1 && onClearAll && (
          <button onClick={onClearAll} className="text-xs text-muted-foreground hover:text-foreground underline transition-colors">
            Clear all
          </button>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
