import { useState } from "react";
import { Archive, Edit2, Loader2, RotateCcw } from "lucide-react";
import { formatDate } from "@mms/shared";
import { Button } from "@/components/ui/button";
import { WarningCallout } from "@/components/ui/WarningCallout";
import { formatEntityStamp } from "@/lib/formatEntityStamp";

export interface DetailDrawerArchivedBannerProps {
  deletedAt: unknown;
  /** Build banner description from a formatted date string (drawer chrome). */
  describe?: (formattedDate: string) => string;
  /** Optional title (directory cards); when set, takes precedence over describe-only layout. */
  title?: string;
  /** Optional body text (e.g. deletion reason on cards). */
  description?: string;
}

/** Soft-delete archive banner for entity detail drawers and directory cards. */
export function DetailDrawerArchivedBanner({
  deletedAt,
  describe,
  title,
  description,
}: DetailDrawerArchivedBannerProps): React.JSX.Element | null {
  const stamp = formatEntityStamp(deletedAt);
  if (!stamp) return null;

  const formatted = formatDate(stamp);
  const resolvedDescription = description ?? (describe ? describe(formatted) : undefined);
  if (!title && !resolvedDescription) return null;

  return (
    <WarningCallout
      icon={Archive}
      density="compact"
      role="status"
      title={title}
      description={resolvedDescription}
    />
  );
}

export interface EntityArchivedBannerProps {
  deletedAt: unknown;
  deletionReason?: string | null;
  /** Localized title including formatted archive date. */
  titleWithDate: (formattedDate: string) => string;
  /** Localized label prefix for deletion reason (e.g. "Reason"). */
  reasonLabel: string;
}

/**
 * Soft-delete archive banner shared by Contacts / Students (and peer directories).
 * Builds title + optional reason description; chrome via {@link DetailDrawerArchivedBanner}.
 */
export function EntityArchivedBanner({
  deletedAt,
  deletionReason,
  titleWithDate,
  reasonLabel,
}: EntityArchivedBannerProps): React.JSX.Element | null {
  const stamp = formatEntityStamp(deletedAt);
  if (!stamp) return null;

  return (
    <DetailDrawerArchivedBanner
      deletedAt={deletedAt}
      title={titleWithDate(formatDate(stamp))}
      description={
        deletionReason ? `${reasonLabel}: ${deletionReason}` : undefined
      }
    />
  );
}

export interface DrawerSyncStatusFooterProps {
  isArchived: boolean;
  /** Localized "archived" status label shown when the entity is soft-deleted. */
  archivedLabel: string;
  /** Localized "synced" status label shown when the entity is active. */
  syncedLabel: string;
}

/**
 * Synced/archived status footer shared by entity detail drawers
 * (Students / Teachers / Sessions). Communicates state by text + color together (WCAG).
 */
export function DrawerSyncStatusFooter({
  isArchived,
  archivedLabel,
  syncedLabel,
}: DrawerSyncStatusFooterProps): React.JSX.Element {
  return (
    <div className="flex items-center gap-1.5">
      <div
        className={`w-1.5 h-1.5 rounded-full ${isArchived ? "bg-warning" : "bg-success"}`}
        aria-hidden
      />
      <span
        className={`text-xs font-bold uppercase ${isArchived ? "text-warning" : "text-success"}`}
      >
        {isArchived ? archivedLabel : syncedLabel}
      </span>
    </div>
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
