import React, { useEffect } from "react";
import {
  BulkSelectionBar,
  type BulkSelectionPlacement,
  type BulkSelectionTone,
} from "@/components/ui/BulkSelectionBar";
import {
  BulkSelectionClearAction,
  BulkSelectionDeleteAction,
  BulkSelectionRestoreAction,
  BulkSelectionExportAction,
  BulkSelectionMessagingActions,
  BulkSelectionStatusAction,
  type BulkSelectionMessageChannel,
} from "@/components/ui/BulkSelectionActions";

export {
  BulkSelectionDeleteAction,
  BulkSelectionRestoreAction,
  BulkSelectionExportAction,
  BulkSelectionMessagingActions,
  BulkSelectionStatusAction,
  type BulkSelectionMessageChannel,
};

export interface BulkActionDockProps {
  selectedCount: number;
  countLabel: React.ReactNode;
  onClearSelection: () => void;
  clearLabel?: string;
  placement?: BulkSelectionPlacement;
  tone?: BulkSelectionTone;
  leading?: React.ReactNode;
  children?: React.ReactNode;
  trailing?: React.ReactNode;
  className?: string;
  "aria-label"?: string;
  /** When true, pressing Escape clears selection. Default: true. */
  enableEscapeKey?: boolean;
}

/**
 * Universal BulkActionDock primitive.
 * Fixed/floating selection dock wrapping BulkSelectionBar with Escape hotkey integration,
 * selection count badge, and standardized bulk actions.
 */
export function BulkActionDock({
  selectedCount,
  countLabel,
  onClearSelection,
  clearLabel,
  placement = "floating",
  tone = "glass",
  leading,
  children,
  trailing,
  className,
  "aria-label": ariaLabel = "Bulk actions toolbar",
  enableEscapeKey = true,
}: BulkActionDockProps): React.JSX.Element {
  useEffect(() => {
    if (!enableEscapeKey || selectedCount === 0) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClearSelection();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [enableEscapeKey, selectedCount, onClearSelection]);

  return (
    <BulkSelectionBar
      selectedCount={selectedCount}
      countLabel={countLabel}
      placement={placement}
      tone={tone}
      leading={leading}
      aria-label={ariaLabel}
      className={className}
      trailing={
        trailing ?? (clearLabel ? (
          <BulkSelectionClearAction label={clearLabel} onClick={onClearSelection} />
        ) : undefined)
      }
    >
      {children}
    </BulkSelectionBar>
  );
}
