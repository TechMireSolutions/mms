import { useState } from "react";
import { Archive, Edit2, Loader2, RotateCcw } from "lucide-react";
import { formatDate } from "@mms/shared";
import { Button } from "@/components/ui/button";
import { WarningCallout } from "@/components/ui/WarningCallout";
import { formatEntityStamp } from "@/lib/formatEntityStamp";

export interface DetailDrawerArchivedBannerProps {
  deletedAt: unknown;
  description: string;
}

/** Soft-delete archive banner for entity detail drawers. */
export function DetailDrawerArchivedBanner({
  deletedAt,
  description,
}: DetailDrawerArchivedBannerProps): React.JSX.Element | null {
  const archivedAt = formatEntityStamp(deletedAt);
  if (!archivedAt) return null;

  return (
    <WarningCallout
      icon={Archive}
      density="compact"
      role="status"
      description={description}
    />
  );
}

export interface DetailDrawerRestoreOrEditActionProps {
  isArchived: boolean;
  canRestore: boolean;
  canEdit: boolean;
  restoreLabel: string;
  editLabel: string;
  onRestore?: () => void | Promise<void>;
  onEdit?: () => void;
  className?: string;
}

/** Header restore (archived) or edit action for entity detail drawers. */
export function DetailDrawerRestoreOrEditAction({
  isArchived,
  canRestore,
  canEdit,
  restoreLabel,
  editLabel,
  onRestore,
  onEdit,
  className = "rounded-lg border border-border hover:bg-muted transition-colors text-muted-foreground hover:text-foreground shadow-none",
}: DetailDrawerRestoreOrEditActionProps): React.JSX.Element | null {
  const [restoring, setRestoring] = useState(false);

  if (isArchived && canRestore && onRestore) {
    return (
      <Button
        type="button"
        variant="outline"
        size="icon"
        disabled={restoring}
        onClick={() => {
          void (async () => {
            setRestoring(true);
            try {
              await onRestore();
            } finally {
              setRestoring(false);
            }
          })();
        }}
        aria-label={restoreLabel}
        aria-busy={restoring}
        className={className}
        title={restoreLabel}
      >
        {restoring ? (
          <Loader2 className="w-4 h-4 animate-spin motion-reduce:animate-none" aria-hidden />
        ) : (
          <RotateCcw className="w-4 h-4" />
        )}
      </Button>
    );
  }

  if (!canEdit || isArchived || !onEdit) return null;

  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      onClick={onEdit}
      aria-label={editLabel}
      className={className}
      title={editLabel}
    >
      <Edit2 className="w-4 h-4" />
    </Button>
  );
}

/** Build archived banner description with formatted date (caller supplies t() template result with date). */
export function formatArchivedBannerDate(deletedAt: unknown): string | null {
  const stamp = formatEntityStamp(deletedAt);
  return stamp ? formatDate(stamp) : null;
}
