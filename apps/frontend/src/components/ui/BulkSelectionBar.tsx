import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type BulkSelectionPlacement = "floating" | "inline";
export type BulkSelectionTone = "glass" | "tint" | "plain";

/** Shared outline action button classes for floating bulk bars. */
export const bulkSelectionActionClassName =
  "px-3 py-1.5 rounded-lg border-border text-xs font-semibold hover:bg-muted text-foreground transition-colors min-h-11 flex items-center gap-1.5";

/** Shared destructive delete button classes for floating bulk bars. */
export const bulkSelectionDeleteClassName =
  "px-3 py-1.5 rounded-lg bg-destructive text-destructive-foreground text-xs font-semibold hover:bg-destructive/90 transition-colors min-h-11 flex items-center gap-1.5";

/** Shared restore outline button classes for floating bulk bars. */
export const bulkSelectionRestoreClassName =
  "px-3 py-1.5 rounded-lg border-primary/40 text-primary text-xs font-semibold hover:bg-primary/10 transition-colors min-h-11 flex items-center gap-1.5";

const PLACEMENT: Record<BulkSelectionPlacement, string> = {
  floating:
    "fixed inset-x-4 bottom-4 z-header max-w-full sm:inset-x-auto sm:end-6 sm:bottom-6 bg-card/95 border border-primary/20 backdrop-blur-xl shadow-2xl rounded-2xl p-3 flex flex-wrap items-center gap-3 border-s-4 border-s-primary",
  inline: "flex flex-wrap items-center justify-between gap-3 px-4 py-3 rounded-xl max-w-full",
};

const INLINE_TONE: Record<BulkSelectionTone, string> = {
  glass: "bg-card/90 border border-primary/20 shadow-md backdrop-blur-md",
  tint: "border border-primary/20 bg-primary/5 gap-2 py-2.5",
  plain: "border border-border bg-card",
};

export interface BulkSelectionBarProps {
  selectedCount: number;
  countLabel: ReactNode;
  placement?: BulkSelectionPlacement;
  /** Inline only — ignored when floating. */
  tone?: BulkSelectionTone;
  leading?: ReactNode;
  children?: ReactNode;
  trailing?: ReactNode;
  className?: string;
  "aria-label"?: string;
}

export const BulkSelectionBar = (function BulkSelectionBar({
  selectedCount,
  countLabel,
  placement = "inline",
  tone = "glass",
  leading,
  children,
  trailing,
  className,
  "aria-label": ariaLabel,
}: BulkSelectionBarProps): React.JSX.Element {
  const enterY = placement === "floating" ? 20 : -8;

  return (
    <AnimatePresence>
      {selectedCount > 0 && (
        <motion.div
          role="region"
          aria-label={ariaLabel}
          initial={{ opacity: 0, y: enterY }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: enterY }}
          className={cn(
            placement === "floating"
              ? PLACEMENT.floating
              : cn(PLACEMENT.inline, INLINE_TONE[tone]),
            className,
          )}
        >
          <div className="flex min-w-0 items-center gap-2">
            {leading}
            <span
              className={cn(
                "text-foreground",
                placement === "floating" ? "text-xs font-bold ps-1" : "text-sm font-semibold",
              )}
            >
              {countLabel}
            </span>
            {placement === "floating" && children ? (
              <div className="h-4 w-px bg-border" aria-hidden />
            ) : null}
          </div>
          {(children || trailing) && (
            <div className="flex min-w-0 flex-wrap items-center gap-2 sm:gap-3">
              {children}
              {trailing}
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
});
