import React from "react";
import type { ReactNode } from "react";
import {
  BulkActionDock,
  type BulkActionDockPlacement,
  type BulkActionDockTone,
} from "@/components/common/BulkActionDock";

export type BulkSelectionPlacement = BulkActionDockPlacement;
export type BulkSelectionTone = BulkActionDockTone;

/** Shared outline action button classes for floating bulk bars. */
export const bulkSelectionActionClassName =
  "px-3 py-1.5 rounded-lg border-border text-xs font-semibold hover:bg-muted text-foreground transition-colors min-h-11 flex items-center gap-1.5";

/** Shared destructive delete button classes for floating bulk bars. */
export const bulkSelectionDeleteClassName =
  "px-3 py-1.5 rounded-lg bg-destructive text-destructive-foreground text-xs font-semibold hover:bg-destructive/90 transition-colors min-h-11 flex items-center gap-1.5";

/** Shared restore outline button classes for floating bulk bars. */
export const bulkSelectionRestoreClassName =
  "px-3 py-1.5 rounded-lg border-primary/40 text-primary text-xs font-semibold hover:bg-primary/10 transition-colors min-h-11 flex items-center gap-1.5";

export interface BulkSelectionBarProps {
  selectedCount: number;
  countLabel: ReactNode;
  placement?: BulkSelectionPlacement;
  tone?: BulkSelectionTone;
  leading?: ReactNode;
  children?: ReactNode;
  trailing?: ReactNode;
  className?: string;
  "aria-label"?: string;
}

/**
 * Backward-compatible wrapper delegating to consolidated BulkActionDock.
 */
export const BulkSelectionBar = React.memo(function BulkSelectionBar({
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
  return (
    <BulkActionDock
      selectedCount={selectedCount}
      countLabel={countLabel}
      placement={placement}
      tone={tone}
      leading={leading}
      trailing={trailing}
      className={className}
      aria-label={ariaLabel}
    >
      {children}
    </BulkActionDock>
  );
});
