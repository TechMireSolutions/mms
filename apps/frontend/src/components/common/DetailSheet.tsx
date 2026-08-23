import React from "react";
import { RotateCcw } from "lucide-react";
import {
  DetailDrawerShell,
  type DetailDrawerShellProps,
  type DetailDrawerSize,
} from "@/components/ui/DetailDrawerShell";
import { DetailDrawerArchivedBanner } from "@/components/ui/DetailDrawerArchiveChrome";
import { Button } from "@/components/ui/button";

export type { DetailDrawerSize };

export interface DetailSheetProps extends DetailDrawerShellProps {
  /** Optional soft-delete / archive state to automatically display WarningCallout and Restore button. */
  archiveState?: {
    isDeleted: boolean;
    deletedAt?: string | null;
    deletedBy?: string | null;
    canRestore?: boolean;
    onRestore?: () => void;
    recordTitle?: string;
    restoreLabel?: string;
  };
}

/**
 * Universal DetailSheet primitive.
 * BiDi-aware Radix/Framer slide-over drawer from inline-end with responsive bottom-sheet adaptation on mobile
 * and optional integrated archive banner.
 */
export function DetailSheet({
  archiveState,
  children,
  ...props
}: DetailSheetProps): React.JSX.Element | null {
  return (
    <DetailDrawerShell {...props}>
      {archiveState?.isDeleted ? (
        <div className="mb-4 space-y-2">
          <DetailDrawerArchivedBanner
            deletedAt={archiveState.deletedAt}
            title={archiveState.recordTitle ? `Archived: ${archiveState.recordTitle}` : undefined}
            description={
              archiveState.deletedBy ? `Archived by ${archiveState.deletedBy}` : undefined
            }
          />
          {archiveState.canRestore && archiveState.onRestore ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={archiveState.onRestore}
              className="w-full gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              {archiveState.restoreLabel ?? "Restore"}
            </Button>
          ) : null}
        </div>
      ) : null}
      {children}
    </DetailDrawerShell>
  );
}
